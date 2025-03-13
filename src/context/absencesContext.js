import React, { createContext, useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    format, parseISO, startOfWeek, endOfWeek, addDays, isSameDay, isBefore, isAfter,
    differenceInMinutes, subWeeks, subMonths, subDays, isWithinInterval
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { useUser } from '../hooks/useUser';
import { ToastType, useToast } from '../hooks/useToast';
import logger from '../services/logger';

// Clés de stockage
const STORAGE_KEY = 'absences_data';
const LAST_UPDATED_KEY = 'absences_last_updated';
const CACHE_DURATION = 3600000; // Durée de validité du cache en ms (1 heure)

// Enumérations des périodes de filtre
export const FILTER_PERIODS = {
    ALL: 'all',
    WEEK: 'week',
    MONTH: 'month',
    SEMESTER: 'semester'
};

// Types de statut d'absence
export const ABSENCE_STATUS = {
    JUSTIFIED: 'justified',
    UNJUSTIFIED: 'unjustified'
};

export const AbsencesContext = createContext();

export const AbsencesProvider = ({ children }) => {
    // Récupérer les hooks nécessaires
    const { isAuthenticated, getAbsences, justifyAbsence } = useUser();
    const toast = useToast();

    // Référence pour suivre les appels en cours et éviter les appels multiples
    const fetchingRef = useRef(false);
    const lastFetchTimeRef = useRef(0);
    const DEBOUNCE_DELAY = 2000; // 2 secondes de délai entre les appels

    // États du contexte
    const [absences, setAbsences] = useState([]);
    const [filteredAbsences, setFilteredAbsences] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);

    // Filtres
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPeriod, setFilterPeriod] = useState(FILTER_PERIODS.ALL);
    const [ueFilter, setUeFilter] = useState(null); // Pour future fonctionnalité de filtrage par UE

    // Fonction utilitaire pour formater une date ISO - définie en premier pour éviter les problèmes de dépendance
    const formatDate = useCallback((isoDate) => {
        if (!isoDate) return '';
        const date = new Date(isoDate);
        return format(date, 'dd/MM/yyyy', { locale: fr });
    }, []);

    // Fonction utilitaire pour formater l'heure depuis un ISO
    const formatTime = useCallback((isoDate) => {
        if (!isoDate) return '';
        const date = new Date(isoDate);
        return format(date, 'HH:mm', { locale: fr });
    }, []);

    // Fonction utilitaire pour créer une plage horaire depuis deux ISO
    const formatTimeRange = useCallback((startISO, endISO) => {
        if (!startISO || !endISO) return '';
        return `${formatTime(startISO)} - ${formatTime(endISO)}`;
    }, [formatTime]);

    // Adapter une absence pour l'affichage - définie avant d'être utilisée dans les dépendances
    const adaptAbsenceForDisplay = useCallback((absence) => {
        if (!absence) return null;

        // Formatage de la date et de l'heure
        const date = formatDate(absence.startTime);
        const time = formatTimeRange(absence.startTime, absence.endTime);

        // Formatage des enseignants (joindre avec des virgules si multiples)
        const teacher = absence.teachers.join(', ');

        // Formatage du statut
        const status = absence.status.justified ? 'Justifiée' : 'Non justifiée';

        // Adaptation pour l'affichage
        return {
            ...absence,
            date,
            time,
            teacher,
            room: absence.location,
            status,
            course: absence.courseName,
            justificationDate: absence.status.justificationDate ? formatDate(absence.status.justificationDate) : null
        };
    }, [formatDate, formatTimeRange]);

    // Statistiques mémorisées
    const stats = useMemo(() => {
        if (!absences.length) {
            return {
                total: 0,
                justified: 0,
                unjustified: 0,
                totalHours: 0,
                justifiedHours: 0,
                unjustifiedHours: 0
            };
        }

        let totalHours = 0;
        let justifiedHours = 0;
        let unjustifiedHours = 0;

        absences.forEach(absence => {
            const startTime = new Date(absence.startTime);
            const endTime = new Date(absence.endTime);
            const durationHours = differenceInMinutes(endTime, startTime) / 60;

            totalHours += durationHours;

            if (absence.status.justified) {
                justifiedHours += durationHours;
            } else {
                unjustifiedHours += durationHours;
            }
        });

        return {
            total: absences.length,
            justified: absences.filter(a => a.status.justified).length,
            unjustified: absences.filter(a => !a.status.justified).length,
            totalHours: parseFloat(totalHours.toFixed(1)),
            justifiedHours: parseFloat(justifiedHours.toFixed(1)),
            unjustifiedHours: parseFloat(unjustifiedHours.toFixed(1))
        };
    }, [absences]);

    // Stats par UE (préparation pour fonctionnalité future)
    const statsByUE = useMemo(() => {
        if (!absences.length) return {};

        const ueStats = {};

        // Regrouper les absences par UE
        absences.forEach(absence => {
            // Ici, nous partons du principe que le nom du cours peut contenir l'UE
            // Cette logique devra être adaptée selon votre modèle de données réel
            const courseParts = absence.courseName.split(' - ');
            const ue = courseParts.length > 0 ? courseParts[0] : 'Inconnu';

            if (!ueStats[ue]) {
                ueStats[ue] = {
                    total: 0,
                    justified: 0,
                    unjustified: 0,
                    totalHours: 0
                };
            }

            ueStats[ue].total += 1;
            if (absence.status.justified) {
                ueStats[ue].justified += 1;
            } else {
                ueStats[ue].unjustified += 1;
            }

            const durationHours = absence.duration / 60;
            ueStats[ue].totalHours += durationHours;
        });

        return ueStats;
    }, [absences]);

    // Fonction pour déterminer si le cache est valide
    const isCacheValid = useCallback(() => {
        if (!lastUpdated) return false;

        const now = new Date();
        const timeDiff = now.getTime() - lastUpdated.getTime();

        return timeDiff < CACHE_DURATION;
    }, [lastUpdated]);

    // Fonction pour sauvegarder les absences dans le stockage local
    const saveToStorage = useCallback(async (data) => {
        try {
            const now = new Date();
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            await AsyncStorage.setItem(LAST_UPDATED_KEY, now.toISOString());
            setLastUpdated(now);
        } catch (err) {
            console.error('Erreur lors de la sauvegarde des absences:', err);
        }
    }, []);

    // Fonction pour charger les absences depuis le stockage local - simplifiée et avec référence
    const loadFromStorage = useCallback(async () => {
        try {
            const storedData = await AsyncStorage.getItem(STORAGE_KEY);
            const lastUpdatedString = await AsyncStorage.getItem(LAST_UPDATED_KEY);

            if (storedData) {
                const parsedData = JSON.parse(storedData);

                // Ne pas déclencher de mise à jour d'état si les données sont identiques
                const currentDataString = JSON.stringify(absences);
                const newDataString = JSON.stringify(parsedData);

                if (currentDataString !== newDataString) {
                    setAbsences(parsedData);
                    logger.debug('absencesContext', 'loadFromStorage', `Mise à jour: ${parsedData.length} absences`);
                }

                if (lastUpdatedString) {
                    setLastUpdated(new Date(lastUpdatedString));
                }

                return parsedData;
            }

            return null;
        } catch (err) {
            logger.error('absencesContext', 'loadFromStorage', 'Erreur lors du chargement', { error: err.message });
            return null;
        }
    }, [absences]);

    // Fonction pour vérifier si une date est dans la période spécifiée
    const isDateInPeriod = useCallback((dateISO, period) => {
        const date = new Date(dateISO);
        const today = new Date();

        if (period === FILTER_PERIODS.ALL) return true;

        if (period === FILTER_PERIODS.WEEK) {
            const oneWeekAgo = subWeeks(today, 1);
            return isAfter(date, oneWeekAgo);
        }

        if (period === FILTER_PERIODS.MONTH) {
            const oneMonthAgo = subMonths(today, 1);
            return isAfter(date, oneMonthAgo);
        }

        if (period === FILTER_PERIODS.SEMESTER) {
            const sixMonthsAgo = subMonths(today, 6);
            return isAfter(date, sixMonthsAgo);
        }

        return true;
    }, []);

    // Fonction pour appliquer les filtres (recherche et période)
    const applyFilters = useCallback((data, query, period) => {
        if (!data || data.length === 0) {
            setFilteredAbsences([]);
            return;
        }

        const filtered = data.filter(absence => {
            // Filtre de recherche
            const matchesSearch = !query ||
                absence.courseName.toLowerCase().includes(query.toLowerCase()) ||
                absence.teachers.some(teacher => teacher.toLowerCase().includes(query.toLowerCase())) ||
                absence.location.toLowerCase().includes(query.toLowerCase()) ||
                format(new Date(absence.startTime), 'dd/MM/yyyy').includes(query);

            // Filtre de période
            const matchesPeriod = isDateInPeriod(absence.startTime, period);

            return matchesSearch && matchesPeriod;
        });

        // Ne logger que si le nombre d'absences filtrées a changé
        if (filtered.length !== filteredAbsences.length) {
            logger.debug('absencesContext', 'applyFilters', `Filtrage: ${filtered.length}/${data.length} absences`);
        }

        setFilteredAbsences(filtered);
    }, [isDateInPeriod, filteredAbsences.length]);

    // Fonction pour charger les absences depuis l'API - optimisée avec debounce et meilleure gestion du cache
    const fetchAbsences = useCallback(async (forceRefresh = false) => {
        // Vérification d'authentification
        if (!isAuthenticated) {
            logger.warn('absencesContext', 'fetchAbsences', 'Non authentifié');
            setError('Utilisateur non authentifié');
            setIsLoading(false);
            return false;
        }

        // Protection contre les appels multiples rapprochés
        const now = Date.now();
        if (!forceRefresh && fetchingRef.current) {
            logger.debug('absencesContext', 'fetchAbsences', 'Appel ignoré - déjà en cours');
            return false;
        }

        if (!forceRefresh && now - lastFetchTimeRef.current < DEBOUNCE_DELAY) {
            logger.debug('absencesContext', 'fetchAbsences', 'Appel ignoré - trop rapproché');
            return false;
        }

        // Utiliser le cache si valide et non-forcé
        if (!forceRefresh && absences.length > 0 && isCacheValid()) {
            return true;
        }

        // Essayer d'utiliser le cache stocké
        if (!forceRefresh) {
            const cachedData = await loadFromStorage();
            if (cachedData && isCacheValid()) {
                applyFilters(cachedData, searchQuery, filterPeriod);
                setIsLoading(false);
                return true;
            }
        }

        // Marquer comme en cours de récupération
        fetchingRef.current = true;
        lastFetchTimeRef.current = now;

        try {
            setIsLoading(true);
            setError(null);

            // Ne logguer que lorsqu'on fait réellement un appel API
            logger.debug('absencesContext', 'fetchAbsences', `Rafraîchissement${forceRefresh ? ' forcé' : ''}`);

            const { success, data, error } = await getAbsences();

            if (success) {
                // Vérifier si les données ont changé avant de mettre à jour l'état
                const currentDataString = JSON.stringify(absences);
                const newDataString = JSON.stringify(data);

                if (currentDataString !== newDataString) {
                    setAbsences(data);
                    await saveToStorage(data);
                    applyFilters(data, searchQuery, filterPeriod);
                }

                setIsLoading(false);
                setHasChanges(false);
                fetchingRef.current = false;
                return true;
            } else {
                logger.error('absencesContext', 'fetchAbsences', 'Erreur API', { error });
                toast.error(error.title || 'Absences erreur', 'Erreur lors du chargement des absences');

                // Utiliser le cache en cas d'erreur
                const cachedData = await loadFromStorage();
                if (cachedData) {
                    logger.info('absencesContext', 'fetchAbsences', 'Utilisation des données en cache après erreur');
                    setAbsences(cachedData);
                    applyFilters(cachedData, searchQuery, filterPeriod);
                }

                setIsLoading(false);
                fetchingRef.current = false;
                return false;
            }
        } catch (err) {
            logger.error('absencesContext', 'fetchAbsences', 'Erreur non gérée', { error: err.message });

            // Utiliser le cache même périmé en cas d'erreur
            const cachedData = await loadFromStorage();
            if (cachedData) {
                setAbsences(cachedData);
                applyFilters(cachedData, searchQuery, filterPeriod);
            }

            setIsLoading(false);
            toast.error('Erreur lors de la récupération des absences', err.message);
            fetchingRef.current = false;
            return false;
        }
    }, [
        isAuthenticated,
        isCacheValid,
        loadFromStorage,
        saveToStorage,
        applyFilters,
        searchQuery,
        filterPeriod,
        getAbsences,
        absences,
        toast
    ]);

    // Fonction pour rafraîchir les absences (pull-to-refresh)
    const refreshAbsences = useCallback(async () => {
        setIsRefreshing(true);
        await fetchAbsences(true);
        setIsRefreshing(false);
    }, [fetchAbsences]);

    // Appliquer les filtres lorsqu'ils changent
    useEffect(() => {
        applyFilters(absences, searchQuery, filterPeriod);
    }, [absences, searchQuery, filterPeriod, applyFilters]);

    // Charger les absences au démarrage - une seule fois à l'authentification
    useEffect(() => {
        if (isAuthenticated && absences.length === 0) {
            fetchAbsences();
        }
    }, [isAuthenticated, fetchAbsences, absences.length]);

    // Fonction pour justifier une absence
    const submitJustification = useCallback(async (absenceId, justificationFile) => {
        logger.debug('absencesContext', 'submitJustification', 'Début de la justification', {
            absenceId,
            fileName: justificationFile.name
        });

        if (!isAuthenticated) {
            logger.warn('absencesContext', 'submitJustification', 'Tentative de justification non authentifiée');
            toast.error('Requête invalide - Non authentifié');
            return false;
        }

        try {
            setIsLoading(true);

            const response = await justifyAbsence(absenceId, justificationFile);

            if (response.success) {
                logger.info('absencesContext', 'submitJustification', 'Justification réussie', { absenceId });
                // Mettre à jour l'absence dans l'état local
                const updatedAbsences = absences.map(absence => {
                    if (absence.id === absenceId) {
                        return {
                            ...absence,
                            status: {
                                ...absence.status,
                                justified: true,
                                justificationDate: new Date().toISOString()
                            },
                            justificationFile: justificationFile.name || 'Justificatif'
                        };
                    }
                    return absence;
                });

                setAbsences(updatedAbsences);
                await saveToStorage(updatedAbsences);
                applyFilters(updatedAbsences, searchQuery, filterPeriod);

                toast.success('Votre justificatif a été envoyé avec succès');

                setHasChanges(true);
                setIsLoading(false);
                return true;
            } else {
                logger.error('absencesContext', 'submitJustification', 'Échec de la justification', {
                    absenceId,
                    response
                });
                toast.error('Veuillez réessayer plus tard');

                setIsLoading(false);
                return false;
            }
        } catch (err) {
            logger.error('absencesContext', 'submitJustification', 'Erreur lors de la justification', {
                error: err.message,
                absenceId
            });
            console.error('Erreur lors de la justification de l\'absence:', err);

            toast.error(err.message || 'Veuillez réessayer plus tard'); // Erreur lors de l'envoi du message

            setIsLoading(false);
            return false;
        }
    }, [isAuthenticated, justifyAbsence, absences, saveToStorage, searchQuery, filterPeriod, applyFilters, toast]);

    // Fonction utilitaire pour calculer la durée totale des absences en heures
    const getTotalHours = useCallback((selectedAbsences) => {
        if (!selectedAbsences || !selectedAbsences.length) return 0;

        let totalHours = 0;
        selectedAbsences.forEach(absence => {
            const startTime = new Date(absence.startTime);
            const endTime = new Date(absence.endTime);
            const diff = (endTime - startTime) / (1000 * 60 * 60); // Différence en heures
            totalHours += diff;
        });

        return parseFloat(totalHours.toFixed(1));
    }, []);

    // Fonction pour grouper les absences par semaine (pour la future visualisation)
    const getAbsencesByWeek = useCallback(() => {
        if (!absences.length) return [];

        const groupedByWeek = {};

        absences.forEach(absence => {
            const date = new Date(absence.startTime);
            const weekStart = startOfWeek(date, { locale: fr });
            const weekKey = format(weekStart, 'yyyy-MM-dd');

            if (!groupedByWeek[weekKey]) {
                groupedByWeek[weekKey] = {
                    weekStart: weekStart,
                    weekEnd: endOfWeek(date, { locale: fr }),
                    absences: [],
                    totalHours: 0,
                    justified: 0,
                    unjustified: 0
                };
            }

            groupedByWeek[weekKey].absences.push(absence);

            const durationHours = absence.duration / 60;
            groupedByWeek[weekKey].totalHours += durationHours;

            if (absence.status.justified) {
                groupedByWeek[weekKey].justified += 1;
            } else {
                groupedByWeek[weekKey].unjustified += 1;
            }
        });

        // Convertir en tableau et trier par date
        return Object.values(groupedByWeek).sort((a, b) =>
            b.weekStart.getTime() - a.weekStart.getTime()
        );
    }, [absences]);

    // Préparation pour la future fonctionnalité des UE
    const getAbsencesByUE = useCallback(() => {
        if (!absences.length) return [];

        const ueMap = {};

        absences.forEach(absence => {
            // Logique pour extraire l'UE du nom du cours
            // Cette logique devra être adaptée selon votre modèle de données réel
            const courseParts = absence.courseName.split(' - ');
            const ue = courseParts.length > 0 ? courseParts[0] : 'Inconnu';

            if (!ueMap[ue]) {
                ueMap[ue] = {
                    name: ue,
                    absences: [],
                    totalHours: 0,
                    justified: 0,
                    unjustified: 0
                };
            }

            ueMap[ue].absences.push(absence);

            const durationHours = absence.duration / 60;
            ueMap[ue].totalHours += durationHours;

            if (absence.status.justified) {
                ueMap[ue].justified += 1;
            } else {
                ueMap[ue].unjustified += 1;
            }
        });

        return Object.values(ueMap).sort((a, b) => a.name.localeCompare(b.name));
    }, [absences]);

    const getLastAbsences = useCallback((limit = 5) => {
        if (!absences.length) return [];

        // Trier les absences par date (les plus récentes d'abord)
        const sortedAbsences = [...absences].sort((a, b) => {
            return new Date(b.startTime) - new Date(a.startTime);
        });

        // Prendre seulement le nombre demandé d'absences
        const limitedAbsences = sortedAbsences.slice(0, limit);

        // Adapter chaque absence pour l'affichage
        return limitedAbsences.map(absence => adaptAbsenceForDisplay(absence));
    }, [absences, adaptAbsenceForDisplay]);

    return (
        <AbsencesContext.Provider
            value={{
                // Données
                absences,
                filteredAbsences,
                isLoading,
                isRefreshing,
                error,
                lastUpdated,
                hasChanges,
                searchQuery,
                filterPeriod,

                // Statistiques
                stats,
                statsByUE,

                // Actions
                fetchAbsences,
                refreshAbsences,
                setSearchQuery,
                setFilterPeriod,
                submitJustification,

                // Utilitaires
                getTotalHours,
                formatDate,
                formatTime,
                formatTimeRange,
                adaptAbsenceForDisplay,
                getAbsencesByWeek,
                getAbsencesByUE,
                getLastAbsences,

                // Constantes
                FILTER_PERIODS,
                ABSENCE_STATUS
            }}
        >
            {children}
        </AbsencesContext.Provider>
    );
};

// Hook personnalisé pour utiliser le contexte des absences
export const useAbsences = () => useContext(AbsencesContext);
