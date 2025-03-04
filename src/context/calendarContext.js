import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import { format, parseISO, startOfWeek, endOfWeek, addDays, isSameDay, isBefore, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useUser } from '../hooks/useUser';
import { ToastType, useToast } from '../hooks/useToast';

// Clés de stockage
const STORAGE_KEY = 'calendar_data';
const LAST_UPDATED_KEY = 'calendar_last_updated';
const CALENDAR_URL_KEY = 'secure_calendar_api_url';

// Jours de la semaine pour l'affichage
const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'];

/**
 * Convertit une liste de noms séparés par '\; \n' en une liste séparée par virgules.
 *
 * @param {string} text - Le texte contenant les noms au format 'NOM\; \nNOM\; \n...'
 * @returns {string} Les noms reformatés séparés par des virgules
 */
function formatNames(text) {
    // Diviser le texte en lignes et nettoyer chaque nom
    const names = text.split('\\n');

    // Supprimer les éventuels espaces vides et caractères spéciaux restants
    const cleanedNames = names.map(name => name.trim().replace(/\\/g, '').replace(/;/g, ''));

    // Filtrer les noms vides
    const filteredNames = cleanedNames.filter(name => name.length > 0);

    // Joindre tous les noms avec des virgules et des espaces
    const formattedNames = filteredNames.join(', ');

    return formattedNames;
}

export const CalendarContext = createContext();

export const CalendarProvider = ({ children }) => {
    // Récupérer le contexte utilisateur
    const { isAuthenticated, getCalendar, getCalendarKey } = useUser();
    const toast = useToast();

    const [events, setEvents] = useState([]);
    const [formattedEvents, setFormattedEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [currentWeek, setCurrentWeek] = useState(getWeekLabel(new Date()));
    const [calendarApiUrl, setCalendarApiUrl] = useState(null);

    // Date de référence pour la navigation (initialisée à aujourd'hui)
    const [currentDate, setCurrentDate] = useState(new Date());

    // Récupérer l'URL de l'API du calendrier depuis SecureStore
    const getCalendarApiUrl = async () => {
        try {
            // Vérifier d'abord si l'URL est déjà stockée dans SecureStore
            const storedUrl = await SecureStore.getItemAsync(CALENDAR_URL_KEY);

            if (storedUrl) {
                setCalendarApiUrl(storedUrl);
                return storedUrl;
            } else if (isAuthenticated) {
                // Si l'URL n'est pas stockée, la récupérer via l'API
                const result = await getCalendarKey();

                if (result.success && result.data) {
                    // Supposons que result.data contient l'URL ou la clé nécessaire
                    // Format attendu: { url: 'http://example.com/calendar' } ou { key: 'a12f2f0f-...' }
                    let newUrl;

                    if (result.data.url) {
                        newUrl = result.data.url;
                    } else if (result.data.key) {
                        // Construire l'URL avec la clé fournie
                        newUrl = `${result.data.key}`;
                    } else {
                        throw new Error('Format de données invalide pour la clé de calendrier');
                    }

                    // Stocker l'URL dans SecureStore pour les prochaines utilisations
                    await SecureStore.setItemAsync(CALENDAR_URL_KEY, newUrl);
                    setCalendarApiUrl(newUrl);
                    return newUrl;
                } else {
                    throw new Error(result.error || 'Impossible de récupérer la clé du calendrier');
                }
            } else {
                // L'utilisateur n'est pas authentifié
                return null;
            }
        } catch (err) {
            console.error('Erreur lors de la récupération de l\'URL du calendrier:', err);
            setError(err.message);
            return null;
        }
    };

    // Récupérer les données du calendrier depuis l'API
    const fetchCalendarData = async (checkForChanges = true) => {
        if (!isAuthenticated) {
            setError('Vous devez être connecté pour accéder à votre emploi du temps');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Obtenir l'URL de l'API
            const apiUrl = await getCalendarApiUrl();

            if (!apiUrl) {
                throw new Error('URL du calendrier non disponible');
            }

            const { success, data } = await getCalendar(apiUrl);
            if (!success) {
                throw new Error('Erreur lors de la récupération de l\'emploi du temps');
            }

            // Si nous vérifions les changements, comparer avec les données stockées
            if (checkForChanges) {
                const storedEvents = await getStoredEvents();
                if (storedEvents) {
                    const changes = detectChanges(storedEvents, data.events);
                    if (changes.length > 0) {
                        setHasChanges(true);
                        notifyChanges(changes);
                    }
                }
            }

            // Mettre à jour les données
            setEvents(data.events);
            const formatted = formatEventsForApp(data.events);
            setFormattedEvents(formatted);

            // Stocker les données
            await storeEvents(data.events);
            const now = new Date().toISOString();
            await AsyncStorage.setItem(LAST_UPDATED_KEY, now);
            setLastUpdated(now);

            return data.events;
        } catch (err) {
            setError(err.message);
            console.error('Erreur:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Récupérer les données stockées
    const getStoredEvents = async () => {
        try {
            const storedData = await AsyncStorage.getItem(STORAGE_KEY);
            if (storedData) {
                return JSON.parse(storedData);
            }
            return null;
        } catch (err) {
            console.error('Erreur lors de la récupération des données stockées:', err);
            return null;
        }
    };

    // Stocker les données
    const storeEvents = async (eventsData) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(eventsData));
        } catch (err) {
            console.error('Erreur lors du stockage des données:', err);
        }
    };

    // Détecter les changements entre les anciennes et nouvelles données
    const detectChanges = (oldEvents, newEvents) => {
        const changes = [];

        // Vérifier les suppressions
        oldEvents.forEach(oldEvent => {
            const found = newEvents.some(newEvent => newEvent.id === oldEvent.id);
            if (!found) {
                changes.push({
                    type: 'suppression',
                    event: oldEvent
                });
            }
        });

        // Vérifier les ajouts et modifications
        newEvents.forEach(newEvent => {
            const oldEvent = oldEvents.find(e => e.id === newEvent.id);

            if (!oldEvent) {
                // Nouvel événement
                changes.push({
                    type: 'ajout',
                    event: newEvent
                });
            } else {
                // Vérifier les modifications
                if (
                    newEvent.start.isoString !== oldEvent.start.isoString ||
                    newEvent.end.isoString !== oldEvent.end.isoString ||
                    newEvent.location !== oldEvent.location ||
                    newEvent.title !== oldEvent.title ||
                    !arraysEqual(newEvent.instructors, oldEvent.instructors)
                ) {
                    changes.push({
                        type: 'modification',
                        oldEvent,
                        newEvent
                    });
                }
            }
        });

        return changes;
    };

    // Notifier les changements
    const notifyChanges = (changes) => {
        if (changes.length > 0) {
            toast.info("Changements dans votre emploi du temps", {
                duration: 3000,
                position: toast.positions.TOP
            });
            let message = 'Changements dans votre emploi du temps:\n\n';

            changes.forEach(change => {
                if (change.type === 'ajout') {
                    message += `AJOUT: ${change.event.title} - ${format(parseISO(change.event.start.date), 'dd/MM HH:mm')}\n`;
                } else if (change.type === 'suppression') {
                    message += `SUPPRESSION: ${change.event.title} - ${format(parseISO(change.event.start.date), 'dd/MM HH:mm')}\n`;
                } else if (change.type === 'modification') {
                    message += `MODIFICATION: ${change.newEvent.title} - ${format(parseISO(change.newEvent.start.date), 'dd/MM HH:mm')}\n`;
                }
            });

            Alert.alert(
                'Emploi du temps mis à jour',
                message,
                [{ text: 'OK', onPress: () => setHasChanges(false) }]
            );
        }
    };

    // Convertir les événements au format utilisé par l'application
    const formatEventsForApp = (eventsData) => {
        return eventsData.map(event => {
            const startDate = parseISO(event.start.date);
            const endDate = parseISO(event.end.date);

            // Déterminer le jour de la semaine
            const dayOfWeek = format(startDate, 'E', { locale: fr }).slice(0, 3);

            const courseTypeColors = {
                'TD_SUPYC': '#4DB6AC',     // Turquoise
                'TD_SUPYAC1': '#FF8A65',   // Orange-rouge
                'TG_SUPYB2C': '#66BB6A',   // Vert
                'TP_SUPYC2': '#4FC3F7',      // Bleu
                'Immersion': '#FFB74D',    // Orange
                'TD Parcours Inno': '#9575CD',  // Violet
                '(Campus Vaise) TD Parcours Ouverture Innovation 1': '#9575CD',  // Violet
                'Midterms SUP & SPE': '#F06292',     // Rose
                // Vous pouvez ajouter d'autres types ici
            };

            // Couleur par défaut si le type n'est pas dans la liste
            const defaultColor = '#90A4AE';  // Gris-bleu

            // Dans votre fonction de traitement des événements
            const courseType = event.title.split('-')[0].replace(' ', '');
            const color = courseTypeColors[courseType] || defaultColor;

            return {
                id: event.id,
                day: dayOfWeek,
                startTime: format(startDate, 'HH:mm'),
                endTime: format(endDate, 'HH:mm'),
                startDate: startDate,
                endDate: endDate,
                course: event.title,
                teacher: event.instructors.join(', ') || 'Non spécifié',
                room: event.location ? formatNames(event.location) : "Non spécifié",
                color: color,
                resources: event.resources || [],
                groups: event.groups || []
            };
        });
    };

    // Obtenir les prochains événements (y compris l'événement en cours)
    const getUpcomingEvents = (limit = 2) => {
        const now = new Date();

        // Récupérer tous les événements d'aujourd'hui
        const todayEvents = getEventsForDate(now);

        // Identifier quels événements sont en cours ou à venir et les marquer
        const markedEvents = todayEvents.map(event => {
            const eventStartDate = new Date(event.startDate);
            const eventEndDate = new Date(event.endDate);

            // Vérifier si l'événement est en cours
            const isCurrentEvent = eventStartDate <= now && eventEndDate >= now;
            // Vérifier si l'événement est à venir
            const isUpcoming = eventStartDate > now;

            return {
                ...event,
                isCurrentEvent,
                isUpcoming
            };
        });

        // Filtrer pour ne garder que les événements en cours ou à venir
        const upcomingEvents = markedEvents.filter(event => event.isCurrentEvent || event.isUpcoming);

        // Trier les événements par heure de début
        const sortedEvents = upcomingEvents.sort((a, b) => {
            return new Date(a.startDate) - new Date(b.startDate);
        });

        // Limiter au nombre demandé
        return sortedEvents.slice(0, limit);
    };

    // Obtenir les événements pour une date spécifique
    const getEventsForDate = (date) => {
        return formattedEvents.filter(event => {
            const eventDate = new Date(event.startDate);
            return isSameDay(eventDate, date);
        });
    };

    // Obtenir les événements pour une semaine
    const getEventsForWeek = (date) => {
        const start = startOfWeek(date, { weekStartsOn: 1 });
        const end = endOfWeek(date, { weekStartsOn: 1 });

        return formattedEvents.filter(event => {
            const eventDate = new Date(event.startDate);
            return isAfter(eventDate, start) && isBefore(eventDate, end) ||
                isSameDay(eventDate, start) ||
                isSameDay(eventDate, end);
        });
    };

    // Obtenir le jour de la semaine au format 'Lun', 'Mar', etc.
    const getDayLabel = (date) => {
        const dayNum = date.getDay(); // 0 = dimanche, 1 = lundi, ...
        if (dayNum === 0 || dayNum === 6) {
            return null; // Weekend
        }
        return DAYS[dayNum - 1];
    };

    // Obtenir une date à partir du label du jour ('Lun', 'Mar', etc.)
    const getDateFromDayLabel = (dayLabel, referenceDate = new Date()) => {
        const refDate = new Date(referenceDate);
        const startOfWeekDate = startOfWeek(refDate, { weekStartsOn: 1 });

        const dayIndex = DAYS.indexOf(dayLabel);
        if (dayIndex === -1) return null;

        return addDays(startOfWeekDate, dayIndex);
    };

    // Obtenir les événements pour le jour suivant
    const getEventsForNextDay = (date) => {
        const nextDate = addDays(date, 1);
        const nextDay = nextDate.getDay();

        // Si c'est le weekend (0 = dimanche, 6 = samedi), passer au lundi suivant
        if (nextDay === 0) { // Dimanche
            return getEventsForDate(addDays(nextDate, 1)); // Lundi suivant
        } else if (nextDay === 6) { // Samedi
            return getEventsForDate(addDays(nextDate, 2)); // Lundi suivant
        } else {
            return getEventsForDate(nextDate);
        }
    };

    // Générer le libellé de la semaine (par exemple "Semaine du 24 fév. 2025")
    function getWeekLabel(date) {
        const start = startOfWeek(date, { weekStartsOn: 1 });
        return `Semaine du ${format(start, 'd MMM yyyy', { locale: fr })}`;
    }

    // Variable pour suivre la date actuelle de référence pour la navigation des semaines
    const [currentReferenceDate, setCurrentReferenceDate] = useState(new Date());

    // Changer de semaine
    const changeWeek = (direction) => {
        let newDate;

        if (direction === 'next') {
            newDate = addDays(currentReferenceDate, 7);
        } else {
            newDate = addDays(currentReferenceDate, -7);
        }

        setCurrentReferenceDate(newDate);
        setCurrentDate(newDate);
        setCurrentWeek(getWeekLabel(newDate));
        return getEventsForWeek(newDate);
    };

    // Réinitialiser à la semaine actuelle
    const resetToCurrentWeek = () => {
        const today = new Date();
        setCurrentReferenceDate(today);
        setCurrentDate(today);
        setCurrentWeek(getWeekLabel(today));
        return getEventsForWeek(today);
    };

    // Effacer l'URL du calendrier stockée (utile lors de la déconnexion)
    const clearCalendarUrl = async () => {
        try {
            await SecureStore.deleteItemAsync(CALENDAR_URL_KEY);
            setCalendarApiUrl(null);
        } catch (err) {
            console.error('Erreur lors de la suppression de l\'URL du calendrier:', err);
        }
    };

    // Initialiser les données au démarrage et quand le statut d'authentification change
    useEffect(() => {
        const initCalendarData = async () => {
            if (!isAuthenticated) {
                // Si l'utilisateur n'est pas authentifié, ne pas charger les données
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                // Récupérer les données stockées localement d'abord
                const storedEvents = await getStoredEvents();
                const lastUpdatedStr = await AsyncStorage.getItem(LAST_UPDATED_KEY);

                if (storedEvents) {
                    setEvents(storedEvents);
                    const formatted = formatEventsForApp(storedEvents);
                    setFormattedEvents(formatted);
                    setLastUpdated(lastUpdatedStr);
                }

                // Récupérer les données fraîches depuis l'API
                await fetchCalendarData();
            } catch (err) {
                console.error('Erreur lors de l\'initialisation:', err);
                setError('Erreur lors du chargement des données');
            } finally {
                setIsLoading(false);
            }
        };

        initCalendarData();
    }, [isAuthenticated]);

    // Utilitaire pour comparer deux tableaux
    const arraysEqual = (a, b) => {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    };

    return (
        <CalendarContext.Provider
            value={{
                events,
                formattedEvents,
                isLoading,
                error,
                lastUpdated,
                hasChanges,
                currentWeek,
                currentDate,
                calendarApiUrl,
                setCurrentDate,
                fetchCalendarData,
                getEventsForDate,
                getEventsForWeek,
                getEventsForNextDay,
                getDayLabel,
                getDateFromDayLabel,
                getUpcomingEvents,
                changeWeek,
                resetToCurrentWeek,
                setCurrentWeek,
                clearCalendarUrl,
                DAYS
            }}
        >
            {children}
        </CalendarContext.Provider>
    );
};

// Hook personnalisé pour utiliser le contexte du calendrier
export const useCalendar = () => useContext(CalendarContext);
