import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/themeContext';
import { useCalendar } from '../hooks/useCalendar'; // Importation du hook
import { format } from 'date-fns';
import ModernLoader from '../components/ModernLoader';
import ScheduleModal from '../components/modal/ScheduleModal';
import { DAYS, FULL_DAYS } from '../context/calendarContext';

// Heures de cours possibles - Maintenant avec des demi-heures
const HOURS = Array.from({ length: 48 }, (_, i) => {
    const hours = String(Math.floor(i / 2)).padStart(2, '0');
    const minutes = i % 2 === 0 ? '00' : '30';
    return `${hours}:${minutes}`;
});

// Fonction pour obtenir le jour suivant
const getNextDay = (currentDay) => {
    const currentIndex = FULL_DAYS.indexOf(currentDay);
    return currentIndex < FULL_DAYS.length - 1 ? FULL_DAYS[currentIndex + 1] : null;
};

// Récupérer le jour et affiché le nom complet
const getFullDay = (currentDay) => {
    switch (currentDay) {
        case 'Lun':
            return 'Lundi';
        case 'Mar':
            return 'Mardi';
        case 'Mer':
            return 'Mercredi';
        case 'Jeu':
            return 'Jeudi';
        case 'Ven':
            return 'Vendredi';
        default:
            return currentDay;
    }
}

const ScheduleScreen = () => {
    const { colors, isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();

    // Référence pour le ScrollView
    const scrollViewRef = useRef(null);

    // Utilisation du contexte du calendrier
    const {
        isLoading,
        error,
        currentWeek,
        currentDate,
        setCurrentDate,
        fetchCalendarData,
        getEventsForDate,
        getEventsForNextDay,
        getDayLabel,
        getDateFromDayLabel,
        changeWeek,
        resetToCurrentWeek,
        DAYS
    } = useCalendar();

    // États - utilisation de dates réelles au lieu de libellés de jours
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [showCourseDetails, setShowCourseDetails] = useState(false);

    // État pour suivre l'heure actuelle
    const [currentTimePosition, setCurrentTimePosition] = useState(0);
    const [timeIndicatorVisible, setTimeIndicatorVisible] = useState(false);

    // État pour le mode d'affichage (grille ou liste)
    const [viewMode, setViewMode] = useState('list'); // 'grid' ou 'list'

    // Filtrer les cours par date sélectionnée
    const daySchedule = getEventsForDate(selectedDate);

    // Obtenir les cours du jour suivant
    const nextDaySchedule = getEventsForNextDay(selectedDate);

    // Effet pour rafraîchir les données lors de l'ouverture de la page
    useEffect(() => {
        fetchCalendarData();

        // Initialiser avec la date actuelle
        const today = new Date();
        setSelectedDate(today);
    }, []);

    // Effet pour synchroniser la date sélectionnée avec la date de référence actuelle
    useEffect(() => {
        setSelectedDate(currentDate);
    }, [currentDate]);

    // Effet pour calculer la position de la barre d'heure actuelle et mettre à jour toutes les minutes
    useEffect(() => {
        // Vérifier si la date sélectionnée est aujourd'hui
        const today = new Date();
        const isToday = selectedDate.setHours(0, 0, 0, 0) === today.setHours(0, 0, 0, 0);

        // Fonction pour calculer la position de l'heure actuelle
        const updateCurrentTimePosition = () => {
            if (isToday) {
                const now = new Date();
                const hours = now.getHours();
                const minutes = now.getMinutes();

                // Calcul de la position en fonction des heures et minutes
                const hourHeight = 35; // Hauteur d'une demi-heure dans la grille
                const position = (hours * 2 * hourHeight) + ((minutes / 30) * hourHeight);

                setCurrentTimePosition(position);
                setTimeIndicatorVisible(true);

                // Faire défiler jusqu'à l'heure actuelle si en mode grille
                if (viewMode === 'grid' && scrollViewRef.current) {
                    // Défiler avec un léger décalage pour voir les cours au-dessus
                    const scrollPosition = Math.max(0, position - 100);
                    scrollViewRef.current.scrollTo({ y: scrollPosition, animated: true });
                }
            } else {
                setTimeIndicatorVisible(false);
            }
        };

        // Mettre à jour la position immédiatement
        updateCurrentTimePosition();

        // Mettre à jour toutes les minutes
        const intervalId = setInterval(updateCurrentTimePosition, 60000);

        return () => clearInterval(intervalId);
    }, [selectedDate, viewMode]);

    // Gérer le changement de jour sélectionné
    const handleDaySelection = (dayLabel) => {
        const newDate = getDateFromDayLabel(dayLabel, currentDate);
        if (newDate) {
            setSelectedDate(newDate);
        }
    };

    // Format de l'affichage de l'heure
    const formatTimeDisplay = (startTime, endTime) => {
        return `${startTime} - ${endTime}`;
    };

    // Calcule la position et la hauteur du cours en fonction de l'heure
    const calculateCoursePosition = (startTime, endTime) => {
        const hourHeight = 35; // Hauteur d'une demi-heure dans la grille (maintenant 35px par demi-heure)
        const [startHour, startMinute] = startTime.split(':').map(num => parseInt(num));
        const [endHour, endMinute] = endTime.split(':').map(num => parseInt(num));

        // Calculer la position en tenant compte des demi-heures
        const startPos = (startHour) * 2 * hourHeight + (startMinute === 30 ? hourHeight : 0);
        const endPos = (endHour) * 2 * hourHeight + (endMinute === 30 ? hourHeight : 0);

        const top = startPos;
        const height = endPos - startPos;

        return { top, height };
    };

    // Vérifier si une heure est une heure complète
    const isFullHour = (hour) => {
        return hour.endsWith(':00');
    };

    // Animation pour afficher/masquer les détails du cours
    const toggleCourseDetails = (course) => {
        if (selectedCourse && selectedCourse.id === course.id) {
            setShowCourseDetails(false);
            setSelectedCourse(null);

        } else {
            // Afficher les détails du nouveau cours sélectionné
            setSelectedCourse(course);
            setShowCourseDetails(true);
        }
    };

    // Changer de semaine (précédente/suivante)
    const handleChangeWeek = (direction) => {
        changeWeek(direction);
    };

    // Basculer entre vue grille et liste
    const toggleViewMode = () => {
        setViewMode(prevMode => {
            // Si on passe de grid à list, réinitialiser la date sélectionnée à aujourd'hui
            if (prevMode === 'grid') {
                const today = new Date();
                setSelectedDate(today);
                setCurrentDate(today); // Mettre à jour également la date dans le contexte du calendrier
                scrollViewRef.current.scrollTo({ y: 0, animated: false });
            }
            return prevMode === 'grid' ? 'list' : 'grid';
        });
    };

    // Rendu d'un élément de cours dans la vue liste
    const renderCourseListItem = ({ item }) => (
        <TouchableOpacity
            style={styles.courseListItem}
            onPress={() => toggleCourseDetails(item)}
            activeOpacity={0.7}
        >
            <View style={[styles.courseColorBar, { backgroundColor: item.color }]} />
            <View style={styles.courseListContent}>
                <View style={styles.courseListHeader}>
                    <Text style={styles.courseListTitle}>{item.course}</Text>
                    <Text style={[styles.courseListTime, { color: item.color }]}>
                        {formatTimeDisplay(item.startTime, item.endTime)}
                    </Text>
                </View>
                <View style={styles.courseListDetails}>
                    <View style={styles.courseListDetail}>
                        <Ionicons name="person-outline" size={16} color="#757575" />
                        <Text style={styles.courseListDetailText}>{item.teacher}</Text>
                    </View>
                    <View style={styles.courseListDetail}>
                        <Ionicons name="location-outline" size={16} color="#757575" />
                        <Text style={styles.courseListDetailText}>{item.room}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    const isActualNextCalendarDay = (currentDate) => {
        // Obtenir le jour suivant selon votre logique existante (qui saute les weekends)
        const calculatedNextDay = getNextDay(getDayLabel(currentDate));
        // Créer une nouvelle date qui est le jour calendaire suivant
        const actualNextDate = new Date(currentDate);
        actualNextDate.setDate(currentDate.getDate() + 1);

        // Obtenir l'étiquette de ce vrai jour suivant
        const actualNextDay = getDayLabel(actualNextDate);

        // Comparer les deux résultats
        return calculatedNextDay === actualNextDay;
    }

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            paddingHorizontal: 20,
            paddingBottom: 15,
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
        },
        headerContent: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 15,
        },
        headerButtons: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        backButton: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        headerTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: colors.primary.contrast,
        },
        calendarButton: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        viewModeButton: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        weekSelector: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 15,
            paddingHorizontal: 10,
        },
        weekText: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.primary.contrast,
            textDecorationLine: 'underline',
            textDecorationStyle: 'dotted',
            textAlign: 'center',
        },
        daysNav: {
            display: 'flex',
            flexDirection: 'row',
            maxHeight: 50,
        },
        daysNavContent: {
            paddingHorizontal: 5,
        },
        dayButton: {
            paddingHorizontal: 15,
            paddingVertical: 8,
            borderRadius: 20,
            marginHorizontal: 5,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
        },
        selectedDayButton: {
            backgroundColor: colors.surface,
        },
        dayText: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.primary.contrast,
        },
        selectedDayText: {
            color: colors.primary.main,
        },
        content: {
            flex: 1,
            paddingHorizontal: 10,
            paddingTop: 15,
        },
        timelineContainer: {
            flexDirection: 'row',
        },
        hoursColumn: {
            width: 50,
            transform: [{ translateY: -18 }], // Décaler les heures pour correspondre à la grille
        },
        hourCell: {
            height: 35, // Hauteur réduite pour accommoder les demi-heures
            justifyContent: 'center',
            alignItems: 'center',
        },
        hourText: {
            fontSize: 12,
            color: colors.text.tertiary,
            fontWeight: '500',
        },
        coursesGrid: {
            flex: 1,
            position: 'relative',
        },
        hourLine: {
            position: 'absolute',
            left: 0,
            right: 0,
            height: 1,
            zIndex: 1,
        },
        fullHourLine: {
            backgroundColor: isDarkMode ? colors.text.muted : '#CCCCCC', // Ligne plus prononcée pour les heures complètes
            height: 1,
        },
        halfHourLine: {
            backgroundColor: colors.border, // Ligne moins prononcée pour les demi-heures
            height: 0.5,
        },

        // Styles pour l'indicateur d'heure actuelle
        currentTimeIndicator: {
            position: 'absolute',
            left: 0,
            right: 0,
            zIndex: 3,  // Au-dessus des cours et des lignes d'heure
            flexDirection: 'row',
            alignItems: 'center',
        },
        currentTimeDot: {
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: '#FF5252',  // Rouge
            marginLeft: -6,  // Positionnement pour l'alignement
        },
        currentTimeLine: {
            flex: 1,
            height: 2,
            backgroundColor: '#FF5252',  // Rouge
        },
        courseItem: {
            position: 'absolute',
            left: 5,
            right: 5,
            borderRadius: 8,
            padding: 10,
            borderLeftWidth: 4,
            backgroundColor: '#E6EFFF',
            // elevation: 2,
            zIndex: 2,
        },
        selectedCourseItem: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 3,
        },
        courseTitle: {
            fontSize: 14,
            fontWeight: 'bold',
            marginBottom: 4,
        },
        courseTime: {
            fontSize: 12,
            color: colors.text.tertiary,
            marginBottom: 2,
        },
        courseRoom: {
            fontSize: 12,
            color: colors.text.tertiary,
        },

        // Styles pour la vue en liste
        listContainer: {
            flex: 1,
            paddingHorizontal: 15,
            paddingTop: 20,
        },
        sectionContainer: {
            marginBottom: 24,
            backgroundColor: colors.surface,
            borderRadius: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 2,
            overflow: 'hidden',
        },
        sectionHeader: {
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        sectionTitle: {
            fontSize: 16,
            fontWeight: 'bold',
            color: colors.text.primary,
        },
        sectionDate: {
            fontSize: 12,
            color: colors.text.tertiary,
        },
        noCourseContainer: {
            alignItems: 'center',
            justifyContent: 'center',
            padding: 30,
        },
        noCourseText: {
            marginTop: 12,
            fontSize: 16,
            color: colors.text.tertiary,
            textAlign: 'center',
        },
        weekendText: {
            marginTop: 12,
            fontSize: 18,
            fontWeight: '600',
            color: colors.text.primary,
            textAlign: 'center',
        },
        courseListItem: {
            flexDirection: 'row',
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        courseColorBar: {
            width: 4,
            borderRadius: 2,
            marginRight: 12,
        },
        courseListContent: {
            flex: 1,
        },
        courseListHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
        },
        courseListTitle: {
            fontSize: 16,
            fontWeight: 'bold',
            color: colors.text.primary,
            flex: 1,
        },
        courseListTime: {
            fontSize: 14,
            fontWeight: '500',
        },
        courseListDetails: {
            flexDirection: 'row',
            flexWrap: 'wrap',
        },
        courseListDetail: {
            flexDirection: 'row',
            alignItems: 'center',
            marginRight: 16,
            marginTop: 4,
        },
        courseListDetailText: {
            fontSize: 14,
            color: colors.text.tertiary,
            marginLeft: 4,
        },

        // Styles pour le panneau de détails
        courseDetailsPanel: {
            position: 'absolute',
            bottom: 50,
            left: 0,
            right: 0,
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingVertical: 20,
            paddingHorizontal: 20,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.1,
            shadowRadius: 5,
        },
        detailsHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 20,
        },
        courseColorIndicator: {
            width: 4,
            height: 24,
            borderRadius: 2,
            marginRight: 12,
        },
        detailsTitle: {
            flex: 1,
            fontSize: 18,
            fontWeight: 'bold',
            color: '#333',
        },
        closeButton: {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: '#F0F0F0',
            justifyContent: 'center',
            alignItems: 'center',
        },
        detailsContent: {
            marginBottom: 10,
        },
        detailsRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 15,
        },
        detailsItem: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        detailsText: {
            fontSize: 14,
            color: '#333',
            marginLeft: 8,
        },
        detailsButton: {
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
        },
        detailsButtonText: {
            fontSize: 14,
            fontWeight: '600',
            color: '#FFFFFF',
        },

        // Styles pour le loader et les erreurs
        loaderContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
        },
        loaderText: {
            fontSize: 16,
            color: '#757575',
            textAlign: 'center',
        },
        errorContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
        },
        errorText: {
            fontSize: 16,
            color: '#D32F2F',
            textAlign: 'center',
            marginBottom: 16,
        },
        retryButton: {
            backgroundColor: '#4A6FE1',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
        },
        retryButtonText: {
            fontSize: 14,
            fontWeight: '600',
            color: '#FFFFFF',
        },
    });

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

            {/* Header avec dégradé */}
            <LinearGradient
                colors={[colors.gradients.primary[0], colors.gradients.primary[1]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.header, { paddingTop: insets.top + 10 }]}
            >
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Emploi du temps</Text>
                    <View style={styles.headerButtons}>
                        {/* Bouton pour rafraîchir les données */}
                        <TouchableOpacity
                            style={[styles.viewModeButton, { marginRight: 10 }]}
                            onPress={() => fetchCalendarData()}
                        >
                            <Ionicons name="refresh" size={20} color={colors.primary.contrast} />
                        </TouchableOpacity>

                        {/* Bouton pour basculer entre les vues grille et liste */}
                        <TouchableOpacity
                            style={styles.viewModeButton}
                            onPress={toggleViewMode}
                        >
                            <Ionicons
                                name={viewMode === 'grid' ? "list" : "grid"}
                                size={20}
                                color={colors.primary.contrast}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Navigation des jours (visible seulement en mode grille) */}
                {viewMode === 'grid' && (
                    <>
                        <View style={styles.weekSelector}>
                            <TouchableOpacity onPress={() => handleChangeWeek('prev')}>
                                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={resetToCurrentWeek}>
                                <Text style={styles.weekText}>{currentWeek}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleChangeWeek('next')}>
                                <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                        <View
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.daysNav}
                            contentContainerStyle={styles.daysNavContent}
                        >
                            {DAYS.map((day) => (
                                <TouchableOpacity
                                    key={day}
                                    style={[
                                        styles.dayButton,
                                        getDayLabel(selectedDate) === day && styles.selectedDayButton,
                                    ]}
                                    onPress={() => handleDaySelection(day)}
                                >
                                    <Text
                                        style={[
                                            styles.dayText,
                                            getDayLabel(selectedDate) === day && styles.selectedDayText,
                                        ]}
                                    >
                                        {day}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
                )}
            </LinearGradient>

            {/* Affichage du loader pendant le chargement */}
            {isLoading && (
                <ModernLoader title="Chargement de l'emploi du temps..." />
            )}

            {/* Affichage des erreurs */}
            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => fetchCalendarData()}
                    >
                        <Text style={styles.retryButtonText}>Réessayer</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Vue en mode grille */}
            {!isLoading && !error && viewMode === 'grid' ? (
                <ScrollView ref={scrollViewRef} style={styles.content} showsVerticalScrollIndicator={false} >
                    <View style={styles.timelineContainer}>
                        {/* Heures sur la gauche */}
                        <View style={styles.hoursColumn}>
                            {HOURS.map((hour) => (
                                <View key={hour} style={[styles.hourCell, { height: 35 }]}>
                                    {isFullHour(hour) && (
                                        <Text style={styles.hourText}>{hour}</Text>
                                    )}
                                </View>
                            ))}
                        </View>

                        {/* Grille des cours */}
                        <View style={styles.coursesGrid}>
                            {/* Lignes de l'heure */}
                            {HOURS.map((hour, index) => (
                                <View
                                    key={`line-${index}`}
                                    style={[
                                        styles.hourLine,
                                        isFullHour(hour) ? styles.fullHourLine : styles.halfHourLine,
                                        { top: index * 35 }
                                    ]}
                                />
                            ))}

                            {/* Barre d'heure actuelle */}
                            {timeIndicatorVisible && (
                                <View
                                    style={[
                                        styles.currentTimeIndicator,
                                        { top: currentTimePosition }
                                    ]}
                                >
                                    <View style={styles.currentTimeDot} />
                                    <View style={styles.currentTimeLine} />
                                </View>
                            )}

                            {/* Affichage des cours pour le jour sélectionné */}
                            {daySchedule.map((course) => {
                                const { top, height } = calculateCoursePosition(
                                    course.startTime,
                                    course.endTime
                                );
                                return (
                                    <TouchableOpacity
                                        key={course.id}
                                        style={[
                                            styles.courseItem,
                                            {
                                                top,
                                                height,
                                                borderLeftColor: course.color,
                                                backgroundColor: selectedCourse?.id === course.id ? `${course.color}80` : `${course.color}50`,
                                            },
                                            selectedCourse?.id === course.id && styles.selectedCourseItem,
                                        ]}
                                        onPress={() => toggleCourseDetails(course)}
                                    >
                                        <Text style={[styles.courseTitle, { color: course.color }]}>
                                            {course.course}
                                        </Text>
                                        <Text style={styles.courseTime}>
                                            {formatTimeDisplay(course.startTime, course.endTime)}
                                        </Text>
                                        <Text style={styles.courseRoom}>{course.room}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Espacement en bas pour le scroll */}
                    <View style={{ height: 100 }} />
                </ScrollView>
            ) : !isLoading && !error ? (
                /* Vue en mode liste */
                <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
                    {/* Section pour les cours du jour */}
                    <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Aujourd'hui - {DAYS.includes(getDayLabel(selectedDate)) ? getFullDay(getDayLabel(selectedDate)) : (isActualNextCalendarDay(currentDate) ? 'Dimanche' : 'Samedi')}</Text>
                            <Text style={styles.sectionDate}>{format(selectedDate, 'd MMM yyyy')}</Text>
                        </View>

                        {daySchedule.length > 0 ? (
                            <FlatList
                                data={daySchedule.sort((a, b) => a.startTime.localeCompare(b.startTime))}
                                renderItem={renderCourseListItem}
                                keyExtractor={item => item.id.toString()}
                                scrollEnabled={false}
                            />
                        ) : (
                            <View style={styles.noCourseContainer}>
                                <Ionicons name="calendar-outline" size={48} color="#CCCCCC" />
                                <Text style={styles.noCourseText}>Aucun cours aujourd'hui</Text>
                            </View>
                        )}
                    </View>

                    {/* Section pour les cours du lendemain */}
                    {!isActualNextCalendarDay(currentDate) ? (
                        <View style={styles.sectionContainer}>
                            <View style={styles.noCourseContainer}>
                                <Ionicons name="sunny-outline" size={48} color="#FFB74D" />
                                <Text style={styles.weekendText}>Bon weekend !</Text>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.sectionContainer}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Demain</Text>
                            </View>

                            {nextDaySchedule.length > 0 ? (
                                <FlatList
                                    data={nextDaySchedule.sort((a, b) => a.startTime.localeCompare(b.startTime))}
                                    renderItem={renderCourseListItem}
                                    keyExtractor={(item) => item.id.toString()}
                                    scrollEnabled={false}
                                />
                            ) : (
                                <View style={styles.noCourseContainer}>
                                    <Ionicons name="calendar-outline" size={48} color="#CCCCCC" />
                                    <Text style={styles.noCourseText}>Aucun cours demain</Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Espacement en bas pour le scroll */}
                    <View style={{ height: 100 }} />
                </ScrollView>
            ) : null}

            {/* Panneau de détails du cours (animé) */}
            {showCourseDetails && selectedCourse && (
                <ScheduleModal selectedCourse={selectedCourse} colors={colors} toggleCourseDetails={toggleCourseDetails} visible={showCourseDetails} />
            )}
        </SafeAreaView>
    );
};


export default ScheduleScreen;
