import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    format, parseISO, startOfWeek, endOfWeek, addDays, isSameDay, isBefore, isAfter,
    differenceInMinutes, subWeeks, subMonths, subDays, isWithinInterval
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { useUser } from '../hooks/useUser';
import { ToastType, useToast } from '../hooks/useToast';

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
    const { showToast } = useToast();

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

    // Fonction pour charger les absences depuis le stockage local
    const loadFromStorage = useCallback(async () => {
        try {
            const storedData = await AsyncStorage.getItem(STORAGE_KEY);
            const lastUpdatedString = await AsyncStorage.getItem(LAST_UPDATED_KEY);

            if (storedData) {
                const parsedData = JSON.parse(storedData);
                setAbsences(parsedData);

                if (lastUpdatedString) {
                    setLastUpdated(new Date(lastUpdatedString));
                }

                return parsedData;
            }

            return null;
        } catch (err) {
            console.error('Erreur lors du chargement des absences depuis le stockage:', err);
            return null;
        }
    }, []);

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

    // Fonction pour déterminer si le cache est valide
    const isCacheValid = useCallback(() => {
        if (!lastUpdated) return false;

        const now = new Date();
        const timeDiff = now.getTime() - lastUpdated.getTime();

        return timeDiff < CACHE_DURATION;
    }, [lastUpdated]);

    // Fonction pour charger les absences depuis l'API
    const fetchAbsences = useCallback(async (forceRefresh = false) => {
        if (!isAuthenticated) {
            setError('Utilisateur non authentifié');
            setIsLoading(false);
            return false;
        }

        // Si on n'est pas en train de forcer un rafraîchissement, on vérifie le cache
        if (!forceRefresh) {
            const cachedData = await loadFromStorage();

            if (cachedData && isCacheValid()) {
                setAbsences(cachedData);
                applyFilters(cachedData, searchQuery, filterPeriod);
                setIsLoading(false);
                return true;
            }
        }

        try {
            setIsLoading(true);
            setError(null);

            const response = await getAbsences();
            if (response.success) {
                const data = response.data;
                setAbsences(data);
                await saveToStorage(data);
                applyFilters(data, searchQuery, filterPeriod);
                setIsLoading(false);
                setHasChanges(false);
                return true;
            } else {
                setError(response.error || 'Erreur lors du chargement des absences');
                // Si on a des données en cache, on les utilise même si elles sont périmées
                const cachedData = await loadFromStorage();
                if (cachedData) {
                    setAbsences(cachedData);
                    applyFilters(cachedData, searchQuery, filterPeriod);
                }
                setIsLoading(false);

                showToast({
                    type: ToastType.ERROR,
                    message: 'Impossible de récupérer les absences',
                    description: response.error || 'Veuillez réessayer plus tard'
                });

                return false;
            }
        } catch (err) {
            console.error('Erreur lors de la récupération des absences:', err);
            setError(err.message || 'Erreur inconnue');

            // Si on a des données en cache, on les utilise même si elles sont périmées
            const cachedData = await loadFromStorage();
            if (cachedData) {
                setAbsences(cachedData);
                applyFilters(cachedData, searchQuery, filterPeriod);
            }

            setIsLoading(false);

            showToast({
                type: ToastType.ERROR,
                message: 'Erreur lors du chargement des absences',
                description: err.message || 'Veuillez réessayer plus tard'
            });

            return false;
        }
    }, [isAuthenticated, getAbsences, loadFromStorage, saveToStorage, isCacheValid, showToast, searchQuery, filterPeriod]);

    // Fonction pour rafraîchir les absences (pull-to-refresh)
    const refreshAbsences = useCallback(async () => {
        setIsRefreshing(true);
        await fetchAbsences(true);
        setIsRefreshing(false);
    }, [fetchAbsences]);

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
        if (!data || data.length === 0) return;
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

        setFilteredAbsences(filtered);
    }, [isDateInPeriod]);

    // Appliquer les filtres lorsqu'ils changent
    useEffect(() => {
        applyFilters(absences, searchQuery, filterPeriod);
    }, [absences, searchQuery, filterPeriod, applyFilters]);

    // Charger les absences au démarrage
    useEffect(() => {
        if (isAuthenticated) {
            fetchAbsences();
        }
    }, [isAuthenticated, fetchAbsences]);

    // Fonction pour justifier une absence
    const submitJustification = useCallback(async (absenceId, justificationFile) => {
        if (!isAuthenticated) {
            showToast({
                type: ToastType.ERROR,
                message: 'Non authentifié',
                description: 'Vous devez être connecté pour justifier une absence'
            });
            return false;
        }

        try {
            setIsLoading(true);

            const response = await justifyAbsence(absenceId, justificationFile);

            if (response.success) {
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

                showToast({
                    type: ToastType.SUCCESS,
                    message: 'Justificatif envoyé',
                    description: 'Votre justificatif a été envoyé avec succès'
                });

                setHasChanges(true);
                setIsLoading(false);
                return true;
            } else {
                showToast({
                    type: ToastType.ERROR,
                    message: 'Erreur lors de l\'envoi du justificatif',
                    description: response.error || 'Veuillez réessayer plus tard'
                });

                setIsLoading(false);
                return false;
            }
        } catch (err) {
            console.error('Erreur lors de la justification de l\'absence:', err);

            showToast({
                type: ToastType.ERROR,
                message: 'Erreur lors de l\'envoi du justificatif',
                description: err.message || 'Veuillez réessayer plus tard'
            });

            setIsLoading(false);
            return false;
        }
    }, [isAuthenticated, justifyAbsence, absences, saveToStorage, showToast, searchQuery, filterPeriod, applyFilters]);

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

    // Fonction utilitaire pour formater une date ISO
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

    // Adapter une absence pour l'affichage
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
