import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, FlatList, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/themeContext';
import { useNavigation } from '@react-navigation/native';
import LoadingScreen from '../components/LoadingScreen';
import { useUser } from '../hooks/useUser';
import ModernLoader from '../components/ModernLoader';
import { useGrades } from '../context/gradesContext';
import { useFocusEffect } from '@react-navigation/native';
import GradesCard from '../components/card/GradesCard';

const GradesScreen = () => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { loading, isAuthenticated } = useUser();

    // Utilisation du contexte grades au lieu d'états locaux
    const {
        isLoading,
        error,
        formattedGrades,
        semesters,
        currentSemester,
        setCurrentSemester,
        courses,
        selectedCourse,
        setSelectedCourse,
        calculateAverageGrade,
        calculateBestGrade,
        calculateLowestGrade,
        getFilteredGrades,
        refreshGrades,
        lastUpdated,
        getFormattedLastUpdated
    } = useGrades();

    // Rafraîchir les données quand l'écran est affiché
    useFocusEffect(
        useCallback(() => {
            // Si les données n'ont pas été mises à jour depuis plus d'une heure,
            // rafraîchir automatiquement
            if (lastUpdated) {
                const lastUpdate = new Date(lastUpdated);
                const oneHourAgo = new Date();
                oneHourAgo.setHours(oneHourAgo.getHours() - 1);

                if (lastUpdate < oneHourAgo) {
                    refreshGrades();
                }
            }
        }, [lastUpdated])
    );

    // Fonction pour rafraîchir les notes (pull-to-refresh)
    const onRefresh = useCallback(() => {
        refreshGrades();
    }, [refreshGrades]);

    if (loading || !isAuthenticated) {
        return <LoadingScreen />;
    }

    // Filtrer les notes selon le semestre et la matière sélectionnés
    const filteredGrades = getFilteredGrades(currentSemester, selectedCourse);

    const renderEmptyGrades = () => (
        <View style={styles.emptyCard}>
            <View style={styles.emptyStateContainer}>
                <View style={styles.noGradeIconContainer}>
                    <Ionicons name="document-text-outline" size={48} color={colors.text.muted} />
                </View>
                <Text style={styles.emptyStateTitle}>Aucune note disponible</Text>
                <Text style={styles.emptyStateMessage}>
                    Aucune note n'est disponible pour la période ou la matière sélectionnée.
                </Text>
            </View>
        </View>
    );

    const renderFooter = () => {
        if (filteredGrades.length === 0) return null;

        return (
            <View style={styles.footer}>
                <Text style={styles.lastUpdated}>
                    Dernière mise à jour : {getFormattedLastUpdated()}
                </Text>
            </View>
        );
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
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
        headerTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: colors.primary.contrast,
        },
        semesterSelector: {
            flexDirection: 'row',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 8,
            marginTop: 15,
            overflow: 'hidden',
        },
        semesterButton: {
            flex: 1,
            paddingVertical: 8,
            alignItems: 'center',
        },
        selectedSemesterButton: {
            backgroundColor: colors.primary.contrast,
            borderRadius: 8,
        },
        semesterButtonText: {
            color: '#E0E8FF',
            fontSize: 14,
            fontWeight: '500',
        },
        selectedSemesterText: {
            color: colors.primary.main,
            fontWeight: '600',
        },
        content: {
            flex: 1,
            paddingHorizontal: 20,
            paddingTop: 20,
        },
        averageContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 20,
        },
        averageCard: {
            width: '31%',
            backgroundColor: colors.surface,
            borderRadius: 15,
            padding: 15,
            alignItems: 'center',
        },
        averageContent: {
            padding: 15,
            alignItems: 'center',
        },
        averageValue: {
            fontSize: 20,
            fontWeight: 'bold',
            color: colors.primary.main,
            marginBottom: 5,
        },
        averageLabel: {
            fontSize: 12,
            color: colors.text.tertiary,
            textAlign: 'center',
        },
        courseFilterContainer: {
            minHeight: 37,
            maxHeight: 37,
            marginBottom: 15,
        },
        courseFilterContent: {
            paddingRight: 20,
        },
        courseFilterButton: {
            paddingHorizontal: 15,
            paddingVertical: 8,
            backgroundColor: colors.surface,
            borderRadius: 25,
            marginRight: 10,
            borderWidth: 1,
            borderColor: colors.border,
        },
        selectedCourseButton: {
            backgroundColor: colors.primary.main,
            borderColor: colors.primary.main,
        },
        courseFilterText: {
            fontSize: 14,
            color: colors.text.tertiary,
        },
        selectedCourseText: {
            color: colors.primary.contrast,
            fontWeight: '500',
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        loadingText: {
            marginTop: 10,
            color: colors.text.tertiary,
            fontSize: 14,
        },
        gradesList: {
            paddingBottom: 80,
        },
        emptyCard: {
            backgroundColor: colors.surface,
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
        emptyStateTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: colors.text.primary,
            marginBottom: 8,
        },
        emptyStateMessage: {
            fontSize: 14,
            color: colors.text.tertiary,
            textAlign: 'center',
            lineHeight: 20,
        },
        footer: {
            marginTop: 15,
            marginBottom: 25,
            alignItems: 'center',
        },
        lastUpdated: {
            fontSize: 12,
            color: '#757575',
            fontStyle: 'italic',
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
            backgroundColor: colors.border,
            borderRadius: 50,
            width: 80,
            height: 80,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
        },
    });

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

            {/* Header with Gradient */}
            <LinearGradient
                colors={[colors.gradients.primary[0], colors.gradients.primary[1]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.header, { paddingTop: insets.top + 10 }]}
            >
                <View style={styles.headerContent}>
                    {/* <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={colors.primary.contrast} />
                    </TouchableOpacity> */}
                    <Text style={styles.headerTitle}>Mes notes</Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Semester selector */}
                <View style={styles.semesterSelector}>
                    {semesters.map((semester) => (
                        <TouchableOpacity
                            key={semester}
                            style={[
                                styles.semesterButton,
                                currentSemester === semester && styles.selectedSemesterButton
                            ]}
                            onPress={() => setCurrentSemester(semester)}
                        >
                            <Text style={[
                                styles.semesterButtonText,
                                currentSemester === semester && styles.selectedSemesterText
                            ]}>{semester}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </LinearGradient>

            <View style={styles.content}>
                {/* Average Card */}
                <View style={styles.averageContainer}>
                    <View style={[styles.averageCard, { backgroundColor: '#4A6FE120' }]}>
                        <Text style={[styles.averageValue, { color: '#4A6FE1' }]}>
                            {calculateAverageGrade(selectedCourse, currentSemester)}
                        </Text>
                        <Text style={[styles.averageLabel, { color: '#4A6FE1' }]}>Moyenne générale</Text>
                    </View>
                    <View style={[styles.averageCard, { backgroundColor: '#66BB6A20' }]}>
                        <Text style={[styles.averageValue, { color: '#66BB6A' }]}>
                            {calculateBestGrade(currentSemester)}
                        </Text>
                        <Text style={[styles.averageLabel, { color: '#66BB6A' }]}>Meilleure note</Text>
                    </View>
                    <View style={[styles.averageCard, { backgroundColor: '#FF8A6520' }]}>
                        <Text style={[styles.averageValue, { color: '#FF8A65' }]}>
                            {calculateLowestGrade(currentSemester)}
                        </Text>
                        <Text style={[styles.averageLabel, { color: '#FF8A65' }]}>Note la plus basse</Text>
                    </View>
                </View>

                {/* Course Filter */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.courseFilterContainer}
                    contentContainerStyle={styles.courseFilterContent}
                >
                    {courses.map((course, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.courseFilterButton,
                                selectedCourse === course && styles.selectedCourseButton
                            ]}
                            onPress={() => setSelectedCourse(course)}
                        >
                            <Text style={[
                                styles.courseFilterText,
                                selectedCourse === course && styles.selectedCourseText
                            ]}>
                                {course}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Grades List */}
                {isLoading ? (
                    <ModernLoader title="Chargement des notes..." />
                ) : (
                    filteredGrades || filteredGrades.length > 0 ? (
                        <FlatList
                            data={filteredGrades}
                            renderItem={({ item }) => <GradesCard item={item} colors={colors} />}
                            keyExtractor={item => item.id.toString()}
                            contentContainerStyle={styles.gradesList}
                            ListEmptyComponent={renderEmptyGrades}
                            ListFooterComponent={renderFooter}
                            showsVerticalScrollIndicator={false}
                            refreshControl={
                                <RefreshControl
                                    refreshing={isLoading}
                                    onRefresh={onRefresh}
                                    colors={['#4A6FE1']}
                                    tintColor={'#4A6FE1'}
                                />
                            }
                        />
                    ) : (
                        <View style={styles.noGradecontainer}>
                            <View style={styles.noGradeIconContainer}>
                                <Ionicons name="document-text-outline" size={48} color="#8e9aaf" />
                            </View>
                            <Text style={styles.noGradeTitle}>Aucune note disponible</Text>
                            <Text style={styles.noGradeSubtitle}>Vos notes apparaîtront ici dès qu'elles seront publiées</Text>
                        </View>
                    )
                )}
            </View>
        </SafeAreaView>
    );
};


export default GradesScreen;
