import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, SafeAreaView, StatusBar, FlatList, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/themeContext';
import { SCREEN } from '../styles/theme';
import { useNavigation } from '@react-navigation/native';
import { useCalendar } from '../hooks/useCalendar';
import { useAbsences } from '../context/absencesContext';
import { useUser } from '../hooks/useUser';
import LoadingScreen from '../components/LoadingScreen';
import ScheduleModal from '../components/modal/ScheduleModal';
import { useGrades } from '../context/gradesContext';
import GradesCard from '../components/card/GradesCard';

const SectionTitleWithRefresh = ({ title, isRefreshing }) => {
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isRefreshing) {
            Animated.loop(
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                })
            ).start();
        } else {
            rotateAnim.setValue(0);
        }
    }, [isRefreshing]);

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    return (
        <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {isRefreshing && (
                <Animated.View style={{ transform: [{ rotate: spin }], marginLeft: 8 }}>
                    <Ionicons name="sync" size={16} color="#4A6FE1" />
                </Animated.View>
            )}
        </View>
    );
};

const HomeScreen = () => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { userData, loading, isAuthenticated, getUpdate } = useUser();
    const [greeting, setGreeting] = useState(() => {
        const currentHour = new Date().getHours();
        if (currentHour < 12) return 'Bonjour';
        if (currentHour < 18) return 'Bon après-midi';
        return 'Bonsoir';
    });

    // Contexte du calendrier pour accéder aux événements
    // Récupérer également isRefreshing pour pouvoir distinguer
    // le chargement initial du rafraîchissement
    const { getUpcomingEvents, isLoading, isRefreshing } = useCalendar();
    const { getLastAbsences } = useAbsences();
    const { getTopThreeGrades } = useGrades();

    const recentAbsences = getLastAbsences(3);
    const recentGrades = getTopThreeGrades();

    // État pour stocker les prochains cours
    const [upcomingCourses, setUpcomingCourses] = useState([]);

    const [selectedCourse, setSelectedCourse] = useState(null);
    const [showCourseDetails, setShowCourseDetails] = useState(false);

    useEffect(() => {
        const verifyVersion = async () => {
            await getUpdate();
        }

        verifyVersion();
    }, []);

    // Mettre à jour les prochains cours
    useEffect(() => {
        const updateUpcomingCourses = () => {
            // Récupérer les 3 prochains cours (incluant le cours actuel s'il existe)
            const nextCourses = getUpcomingEvents(3);
            setUpcomingCourses(nextCourses);
        };

        // Mettre à jour les cours immédiatement
        updateUpcomingCourses();

        // Mettre à jour les cours toutes les minutes
        const intervalId = setInterval(updateUpcomingCourses, 60000);

        // Nettoyer l'intervalle lors du démontage du composant
        return () => clearInterval(intervalId);
    }, [getUpcomingEvents]);

    if (loading || !isAuthenticated) {
        return <LoadingScreen />
    }

    const predefinedCourses = {
        '(Campus Vaise) TD Parcours Ouverture Innovation 1': 'TD Parcours Inno'
    };

    const formatCourseName = (course) => {
        if (!course.includes('-')) {
            return predefinedCourses[course] || course;
        }

        return course.replace(' ', '').split('-').slice(1)
            .map((word, i) => i === 0 && word.charAt(0) === ' ' ? word.substring(1) : word)
            .join(' ');
    };


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

    // Fonction de navigation cohérente
    const navigateTo = (screen) => {
        navigation.navigate(screen);
    };

    const renderCard = (title, icon, color, screen) => (
        <TouchableOpacity
            style={[styles.card, { borderLeftColor: color }]}
            onPress={() => navigateTo(screen)}
        >
            <View style={styles.cardContent}>
                <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
                    <Ionicons name={icon} size={20} color={color} />
                </View>
                <Text style={styles.cardTitle}>{title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#A0A0A0" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

            {/* Header with Gradient */}
            <LinearGradient
                colors={['#4A6FE1', '#6C92F4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.header, { paddingTop: insets.top + 10 }]}
            >
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.greetingText}>{greeting},</Text>
                        <Text style={styles.nameText}>{userData.firstname}</Text>
                    </View>
                    <TouchableOpacity style={styles.profileButton} onPress={() => navigateTo('profile')}>
                        {userData.avatar ? (
                            <Image
                                source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
                                style={styles.profileImage}
                            />
                        ) : (
                            <View>
                                <Text style={{
                                    fontSize: 16,
                                    fontWeight: 700,
                                    color: colors.text.inverse
                                }}>{userData.firstname[0]}{userData.lastname[0]}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Quick Access */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Accès rapide</Text>
                    <View style={styles.quickAccessGrid}>
                        {renderCard('EDT', 'calendar', '#4A6FE1', 'schedule')}
                        {renderCard('Notes', 'school', '#FF8A65', 'notes')}
                        {renderCard('Absences', 'alert-circle', '#FFB74D', 'absences')}
                        {renderCard('Profil', 'person', '#66BB6A', 'profile')}
                    </View>
                </View>

                {/* Upcoming Classes */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <SectionTitleWithRefresh title="Prochains cours" isRefreshing={isRefreshing} />
                        <TouchableOpacity onPress={() => navigateTo('schedule')}>
                            <Text style={styles.seeAllText}>Voir tout</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Indicateur de rafraîchissement */}
                    {/* {renderCalendarStatus()} */}

                    {/* Modifié pour afficher les cours dès qu'ils sont disponibles */}
                    {isLoading && upcomingCourses.length === 0 ? (
                        <View style={styles.courseItem}>
                            <Text style={styles.loadingText}>Chargement des cours...</Text>
                        </View>
                    ) : upcomingCourses.length === 0 ? (
                        <View style={styles.courseItem}>
                            <Text style={styles.noCourseText}>Aucun cours à venir aujourd'hui</Text>
                        </View>
                    ) : (
                        upcomingCourses.map(course => (
                            <TouchableOpacity
                                key={course.id}
                                onPress={() => toggleCourseDetails(course)}
                                style={[
                                    styles.courseItem,
                                    course.isCurrentEvent && styles.currentCourseItem
                                ]}
                            >
                                <View style={styles.courseTimeContainer}>
                                    <Text style={styles.courseTime}>{course.startTime}</Text>
                                </View>
                                <View style={styles.courseDetails}>
                                    <View style={styles.courseHeaderRow}>
                                        <Text style={styles.courseName}>{formatCourseName(course.course)}</Text>
                                        {course.isCurrentEvent && (
                                            <View style={styles.currentBadge}>
                                                <Text style={styles.currentBadgeText}>En cours</Text>
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.courseInfo}>
                                        <View style={styles.infoItem}>
                                            <Ionicons name="location" size={14} color="#757575" />
                                            <Text style={[styles.infoText, { maxWidth: 120 }]} numberOfLines={1} ellipsizeMode='tail'>{course.room}</Text>
                                        </View>
                                        <View style={styles.infoItem}>
                                            <Ionicons name="person" size={14} color="#757575" />
                                            <Text style={styles.infoText}>{course.teacher}</Text>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                {/* Latest Grades */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Dernières notes</Text>
                        <TouchableOpacity onPress={() => navigateTo('notes')}>
                            <Text style={styles.seeAllText}>Voir tout</Text>
                        </TouchableOpacity>
                    </View>

                    {recentGrades.length > 0 ? (
                        <FlatList
                            data={recentGrades}
                            renderItem={GradesCard}
                            keyExtractor={item => item.id.toString()}
                            contentContainerStyle={styles.gradesList}
                            // ListEmptyComponent={renderEmptyGrades}
                            scrollEnabled={false}
                        />
                    ) : (
                        <View style={styles.noGradecontainer}>
                            <View style={styles.noGradeIconContainer}>
                                <Ionicons name="document-text-outline" size={48} color="#8e9aaf" />
                            </View>
                            <Text style={styles.noGradeTitle}>Aucune note disponible</Text>
                            <Text style={styles.noGradeSubtitle}>Vos notes apparaîtront ici dès qu'elles seront publiées</Text>
                        </View>
                    )}
                </View>

                {/* Recent Absences */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Absences récentes</Text>
                        <TouchableOpacity onPress={() => navigateTo('absences')}>
                            <Text style={styles.seeAllText}>Voir tout</Text>
                        </TouchableOpacity>
                    </View>

                    {recentAbsences.length > 0 ? (
                        recentAbsences.map(absence => (
                            <View key={absence.id} style={styles.absenceItem}>
                                <View style={[styles.absenceStatus,
                                { backgroundColor: absence.status === 'Justifiée' ? '#66BB6A20' : '#FF8A6520' }]}>
                                    <Text style={[styles.statusText,
                                    { color: absence.status === 'Justifiée' ? '#66BB6A' : '#FF8A65' }]}>
                                        {absence.status}
                                    </Text>
                                </View>
                                <View style={styles.absenceDetails}>
                                    <Text style={styles.absenceCourse}>{absence.course}</Text>
                                    <Text style={styles.absenceDate}>{absence.date}</Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyCard}>
                            <View style={styles.emptyStateContainer}>
                                <Text style={styles.emptyStateIcon}>✓</Text>
                                <Text style={styles.emptyStateTitle}>Aucune absence récente</Text>
                                <Text style={styles.emptyStateMessage}>
                                    Vous n'avez aucune absence enregistrée pour la période en cours.
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                {/*  */}
                <View style={{ height: 100 }} />
            </ScrollView>
            {showCourseDetails && selectedCourse && (
                <ScheduleModal selectedCourse={selectedCourse} toggleCourseDetails={toggleCourseDetails} visible={showCourseDetails} />
            )}

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 25,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greetingText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#E0E8FF',
    },
    nameText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 4,
    },
    profileButton: {
        width: 45,
        height: 45,
        borderWidth: 3,
        borderColor: "#FFFFFF",
        borderRadius: 22.5,
        justifyContent: 'center',
        alignItems: 'center',
        // elevation: 3,
    },
    profileImage: {
        width: 41,
        height: 41,
        borderRadius: 20.5,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    section: {
        marginTop: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        letterSpacing: 0.3,
        textShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
    },
    seeAllText: {
        fontSize: 14,
        color: '#4A6FE1',
        fontWeight: '500',
    },
    quickAccessGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    card: {
        width: (SCREEN.width - 50) / 2,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 10,
        marginBottom: 10,
        elevation: 2,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderLeftWidth: 4,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 34,
        height: 34,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    courseItem: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    currentCourseItem: {
        borderLeftWidth: 4,
        borderLeftColor: '#4A6FE1',
        backgroundColor: '#F5F9FF',
        transform: [{ scale: 1.02 }],
    },
    courseTimeContainer: {
        width: 65,
        height: 65,
        backgroundColor: '#F0F4FF',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    courseTime: {
        fontSize: 15,
        fontWeight: '700',
        color: '#4A6FE1',
    },
    courseDetails: {
        flex: 1,
        justifyContent: 'center',
    },
    courseHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    courseName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3142',
        flex: 1,
    },
    currentBadge: {
        backgroundColor: '#4A6FE110',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginLeft: 8,
        borderWidth: 1,
        borderColor: '#4A6FE130',
    },
    currentBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4A6FE1',
    },
    courseInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    infoText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
        fontWeight: '500',
    },
    loadingText: {
        fontSize: 14,
        fontStyle: 'italic',
        color: '#757575',
        textAlign: 'center',
        flex: 1,
        padding: 10,
    },
    noCourseText: {
        fontSize: 14,
        fontStyle: 'italic',
        color: '#757575',
        textAlign: 'center',
        flex: 1,
        padding: 10,
    },
    // Nouveaux styles pour l'indicateur de rafraîchissement
    refreshingContainer: {
        backgroundColor: '#F0F8FF',
        borderRadius: 12,
        padding: 8,
        marginBottom: 12,
    },
    refreshingContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    refreshingText: {
        fontSize: 13,
        color: '#4A6FE1',
        fontWeight: '500',
    },
    gradeItem: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        elevation: 1,
        alignItems: 'center',
    },
    gradeCircle: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: '#FF8A6520',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    gradeText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF8A65',
    },
    gradeDetails: {
        flex: 1,
    },
    gradeCourse: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    gradeDate: {
        fontSize: 12,
        color: '#757575',
    },
    absenceItem: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        elevation: 1,
        alignItems: 'center',
    },
    absenceStatus: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginRight: 14,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    absenceDetails: {
        flex: 1,
    },
    absenceCourse: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    absenceDate: {
        fontSize: 12,
        color: '#757575',
    },

    // Style carte Notes
    noGradecontainer: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 24,
        marginVertical: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    noGradeIconContainer: {
        backgroundColor: '#f1f3f8',
        borderRadius: 50,
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    noGradeTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#3d405b',
        marginBottom: 8,
    },
    noGradeSubtitle: {
        fontSize: 14,
        color: '#8e9aaf',
        textAlign: 'center',
        lineHeight: 20,
    },

    // Styles carte Absenses
    emptyCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 24,
        marginVertical: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    emptyStateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    emptyStateIcon: {
        fontSize: 36,
        color: '#4CAF50',
        marginBottom: 12,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333333',
        marginBottom: 8,
    },
    emptyStateMessage: {
        fontSize: 14,
        color: '#666666',
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default HomeScreen;
