import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    StatusBar,
    FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/themeContext';
import { useNavigation } from '@react-navigation/native';
import LoadingScreen from '../components/LoadingScreen';
import { useUser } from '../hooks/useUser';
import ModernLoader from '../components/ModernLoader';
import ConstructionPage from '../components/underConstruction';

const GradesScreen = () => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { userData, loading, isAuthenticated } = useUser();

    return (<ConstructionPage />)

    const [selectedSemester, setSelectedSemester] = useState('Semestre 2');
    const [gradesLoading, setGradesLoading] = useState(true);
    const [grades, setGrades] = useState([]);
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('Toutes les matières');

    useEffect(() => {
        // Simulation du chargement des données de notes
        const timer = setTimeout(() => {
            // Données fictives pour la démo
            const demoGrades = [
                { id: 1, course: 'Mathématiques', grade: '16/20', date: '15/02/2025', coefficient: 3, average: '14.2/20', maxGrade: '18/20', minGrade: '8/20', semester: 'Semestre 2' },
                { id: 2, course: 'Physique', grade: '14.5/20', date: '10/02/2025', coefficient: 2, average: '13.8/20', maxGrade: '17/20', minGrade: '9/20', semester: 'Semestre 2' },
                { id: 3, course: 'Anglais', grade: '17/20', date: '05/02/2025', coefficient: 1, average: '15.5/20', maxGrade: '19/20', minGrade: '11/20', semester: 'Semestre 2' },
                { id: 4, course: 'Informatique', grade: '18/20', date: '01/02/2025', coefficient: 3, average: '16.2/20', maxGrade: '20/20', minGrade: '12/20', semester: 'Semestre 2' },
                { id: 5, course: 'Chimie', grade: '15/20', date: '20/01/2025', coefficient: 2, average: '14.8/20', maxGrade: '18.5/20', minGrade: '10/20', semester: 'Semestre 2' },
                { id: 6, course: 'Histoire', grade: '13.5/20', date: '18/01/2025', coefficient: 1, average: '12.9/20', maxGrade: '16/20', minGrade: '8.5/20', semester: 'Semestre 1' },
                { id: 7, course: 'Géographie', grade: '14/20', date: '15/01/2025', coefficient: 1, average: '13.2/20', maxGrade: '17/20', minGrade: '9/20', semester: 'Semestre 1' },
                { id: 8, course: 'Économie', grade: '15.5/20', date: '10/01/2025', coefficient: 2, average: '14.1/20', maxGrade: '18/20', minGrade: '10.5/20', semester: 'Semestre 1' },
                { id: 9, course: 'Philosophie', grade: '16/20', date: '05/01/2025', coefficient: 2, average: '15.3/20', maxGrade: '19/20', minGrade: '11/20', semester: 'Semestre 1' },
                { id: 10, course: 'Art', grade: '18/20', date: '20/12/2024', coefficient: 1, average: '17.2/20', maxGrade: '19.5/20', minGrade: '14/20', semester: 'Semestre 1' }
            ];

            setGrades(demoGrades);

            // Extraction des matières uniques pour le filtre
            const uniqueCourses = [...new Set(demoGrades.map(grade => grade.course))];
            setCourses(['Toutes les matières', ...uniqueCourses]);

            setGradesLoading(false);
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    if (loading || !isAuthenticated) {
        return <LoadingScreen />;
    }

    const filteredGrades = grades.filter(grade => {
        const semesterMatch = grade.semester === selectedSemester;
        const courseMatch = !selectedCourse || selectedCourse === 'Toutes les matières' || grade.course === selectedCourse;
        return semesterMatch && courseMatch;
    });

    const calculateSemesterAverage = () => {
        const semesterGrades = grades.filter(grade => grade.semester === selectedSemester);

        if (semesterGrades.length === 0) return '0/20';

        const totalPoints = semesterGrades.reduce((sum, grade) => {
            const gradeValue = parseFloat(grade.grade.split('/')[0].replace(',', '.'));
            return sum + (gradeValue * grade.coefficient);
        }, 0);

        const totalCoefficients = semesterGrades.reduce((sum, grade) => sum + grade.coefficient, 0);

        if (totalCoefficients === 0) return '0/20';

        const average = (totalPoints / totalCoefficients).toFixed(1);
        return average;
    };

    const renderEmptyGrades = () => (
        <View style={styles.emptyCard}>
            <View style={styles.emptyStateContainer}>
                <View style={styles.noGradeIconContainer}>
                    <Ionicons name="document-text-outline" size={48} color="#8e9aaf" />
                </View>
                <Text style={styles.emptyStateTitle}>Aucune note disponible</Text>
                <Text style={styles.emptyStateMessage}>
                    Aucune note n'est disponible pour la période ou la matière sélectionnée.
                </Text>
            </View>
        </View>
    );

    const renderGradeItem = ({ item }) => (
        <TouchableOpacity style={styles.gradeItem}>
            <View style={styles.gradeHeader}>
                <View style={styles.gradeCircle}>
                    <Text style={styles.gradeText}>{item.grade.split('/')[0]}</Text>
                </View>
                <View style={styles.gradeDetails}>
                    <Text style={styles.gradeCourse}>{item.course}</Text>
                    <Text style={styles.gradeDate}>{item.date}</Text>
                </View>
                <View style={styles.coefficientBadge}>
                    <Text style={styles.coefficientText}>Coeff. {item.coefficient}</Text>
                </View>
            </View>

            <View style={styles.gradeStats}>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Moyenne classe</Text>
                    <Text style={styles.statValue}>{item.average}</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Note max</Text>
                    <Text style={styles.statValue}>{item.maxGrade}</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Note min</Text>
                    <Text style={styles.statValue}>{item.minGrade}</Text>
                </View>
            </View>
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
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Mes notes</Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Semester selector */}
                <View style={styles.semesterSelector}>
                    <TouchableOpacity
                        style={[
                            styles.semesterButton,
                            selectedSemester === 'Semestre 1' && styles.selectedSemesterButton
                        ]}
                        onPress={() => setSelectedSemester('Semestre 1')}
                    >
                        <Text style={[
                            styles.semesterButtonText,
                            selectedSemester === 'Semestre 1' && styles.selectedSemesterText
                        ]}>Semestre 1</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.semesterButton,
                            selectedSemester === 'Semestre 2' && styles.selectedSemesterButton
                        ]}
                        onPress={() => setSelectedSemester('Semestre 2')}
                    >
                        <Text style={[
                            styles.semesterButtonText,
                            selectedSemester === 'Semestre 2' && styles.selectedSemesterText
                        ]}>Semestre 2</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <View style={styles.content}>
                {/* Average Card */}
                <View style={styles.averageContainer}>
                    <View style={[styles.averageCard, { backgroundColor: '#4A6FE120' }]}>
                        <Text style={[styles.averageValue, { color: '#4A6FE1' }]}>{calculateSemesterAverage()}</Text>
                        <Text style={[styles.averageLabel, { color: '#4A6FE1' }]}>Moyenne générale</Text>
                    </View>
                    <View style={[styles.averageCard, { backgroundColor: '#66BB6A20' }]}>
                        <Text style={[styles.averageValue, { color: '#66BB6A' }]}>{calculateSemesterAverage()}</Text>
                        <Text style={[styles.averageLabel, { color: '#66BB6A' }]}>Meilleure note</Text>
                    </View>
                    <View style={[styles.averageCard, { backgroundColor: '#FF8A6520' }]}>
                        <Text style={[styles.averageValue, { color: '#FF8A65' }]}>{calculateSemesterAverage()}</Text>
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
                {gradesLoading ? (
                    <ModernLoader title="Chargement des notes..." />
                ) : (
                    <FlatList
                        data={filteredGrades}
                        renderItem={renderGradeItem}
                        keyExtractor={item => item.id.toString()}
                        contentContainerStyle={styles.gradesList}
                        ListEmptyComponent={renderEmptyGrades}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
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
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
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
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
    },
    semesterButtonText: {
        color: '#E0E8FF',
        fontSize: 14,
        fontWeight: '500',
    },
    selectedSemesterText: {
        color: '#4A6FE1',
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
        backgroundColor: '#FFFFFF',
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
        color: '#4A6FE1',
        marginBottom: 5,
    },
    averageLabel: {
        fontSize: 12,
        color: '#757575',
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
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    selectedCourseButton: {
        backgroundColor: '#4A6FE1',
        borderColor: '#4A6FE1',
    },
    courseFilterText: {
        fontSize: 14,
        color: '#757575',
    },
    selectedCourseText: {
        color: '#FFFFFF',
        fontWeight: '500',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#757575',
        fontSize: 14,
    },
    gradesList: {
        paddingBottom: 20,
    },
    gradeItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        overflow: 'hidden',
    },
    gradeHeader: {
        flexDirection: 'row',
        padding: 15,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
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
    coefficientBadge: {
        backgroundColor: '#E6EFFF',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 4,
    },
    coefficientText: {
        fontSize: 12,
        color: '#4A6FE1',
        fontWeight: '500',
    },
    gradeStats: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: '#FAFAFA',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        padding: 5,
    },
    statLabel: {
        fontSize: 12,
        color: '#757575',
        marginBottom: 2,
    },
    statValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
    },
    emptyCard: {
        backgroundColor: '#FFFFFF',
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
        color: '#3d405b',
        marginBottom: 8,
    },
    emptyStateMessage: {
        fontSize: 14,
        color: '#8e9aaf',
        textAlign: 'center',
        lineHeight: 20,
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
});

export default GradesScreen;
