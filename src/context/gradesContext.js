import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useUser } from '../hooks/useUser';
import { useToast } from '../hooks/useToast';
import logger from '../services/logger';

// Storage keys
const GRADES_STORAGE_KEY = 'grades_data';
const LAST_UPDATED_GRADES_KEY = 'grades_last_updated';

export const GradeContext = createContext();

export const GradeProvider = ({ children }) => {
    // User authentication and toast context
    const { isAuthenticated, getGrades } = useUser();
    const toast = useToast();

    // State variables
    const [grades, setGrades] = useState([]);
    const [formattedGrades, setFormattedGrades] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [hasNewGrades, setHasNewGrades] = useState(false);
    const [semesters, setSemesters] = useState(['Semestre 1', 'Semestre 2']);
    const [currentSemester, setCurrentSemester] = useState('Semestre 2');
    const [courses, setCourses] = useState(['Toutes les matières']);
    const [selectedCourse, setSelectedCourse] = useState('Toutes les matières');

    // Format the raw grade data for the app (matches GradesScreen expectations)
    const formatGradesForApp = (rawData) => {
        logger.debug('gradesContext.js', 'formatGradesForApp', 'Début du formatage des notes', { dataLength: rawData?.length });
        if (!rawData || !rawData.length) return [];

        return rawData.map((item, index) => {
            // Extraire le nom du cours depuis sessionCode
            const courseName = item.sessionCode ? item.sessionCode.split(' - ')[1] : 'Cours inconnu';

            // Calculer la différence entre la note de l'élève et la moyenne de la classe
            const difference = item.note && item.moyenne ?
                (item.note - item.moyenne).toFixed(2) : "0.00";

            return {
                id: index + 1,
                course: courseName,
                grade: `${item.note}/20`,
                libelle: item.libelle || 'Évaluation',
                coefficient: item.coefficient || 1,
                average: `${item.moyenne ? item.moyenne.toFixed(1) : "0.0"}/20`,
                difference: difference,
                semester: item.semester || 'Semestre 2', // Valeur par défaut
                date: item.dateEvaluation ? new Date(item.dateEvaluation) : new Date(),
                value: parseFloat(item.note) || 0,
                subject: courseName
            };
        });
        logger.debug('gradesContext.js', 'formatGradesForApp', 'Formatage terminé', { formattedLength: rawData.length });
    };

    // Detect changes in grades to notify the user
    const detectGradeChanges = (oldGrades, newGrades) => {
        logger.debug('gradesContext.js', 'detectGradeChanges', 'Vérification des changements de notes', {
            oldGradesCount: oldGrades?.length,
            newGradesCount: newGrades?.length
        });
        if (!oldGrades || !newGrades) return [];

        const changes = [];

        // Map old grades by an identifier (combination of course and evaluation)
        const oldGradeMap = new Map();
        oldGrades.forEach(grade => {
            const key = `${grade.sessionCode}-${grade.libelle}`;
            oldGradeMap.set(key, grade);
        });

        // Check for new or changed grades
        newGrades.forEach(newGrade => {
            const key = `${newGrade.sessionCode}-${newGrade.libelle}`;
            const oldGrade = oldGradeMap.get(key);

            if (!oldGrade) {
                // New grade
                changes.push({
                    type: 'new',
                    grade: newGrade
                });
            } else if (oldGrade.note !== newGrade.note) {
                // Grade changed
                changes.push({
                    type: 'changed',
                    oldGrade,
                    newGrade
                });
            }
        });

        if (changes.length > 0) {
            logger.info('gradesContext.js', 'detectGradeChanges', 'Nouvelles notes détectées', { changesCount: changes.length });
        }
        return changes;
    };

    // Fetch grades from API
    const fetchGradesData = async (checkForChanges = true) => {
        logger.info('gradesContext.js', 'fetchGradesData', 'Début de la récupération des notes', { checkForChanges });

        if (!isAuthenticated) {
            logger.warn('gradesContext.js', 'fetchGradesData', 'Tentative d\'accès sans authentification');
            setError('Vous devez être connecté pour accéder à vos notes');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const { success, data, error } = await getGrades();

            if (!success) {
                logger.error('gradesContext.js', 'fetchGradesData', 'Échec de récupération des notes', { error });
                setError(error?.detail || 'Erreur lors du chargement des notes');
                toast.error({
                    title: error?.title || 'Erreur',
                    description: error?.detail || 'Impossible de récupérer vos notes'
                });
                return null;
            }

            // Si nous n'avons pas de données ou si les notes sont vides
            if (!data || data.length === 0) {
                logger.info('gradesContext.js', 'fetchGradesData', 'Aucune note disponible');
                // Utiliser les données de démonstration (comme dans GradesScreen)
                // const demoData = getDemoGradesData();
                processGradesData([], false);
                return [];
            }

            logger.info('gradesContext.js', 'fetchGradesData', 'Notes récupérées avec succès', { count: data.length });
            // Process the real data
            processGradesData(data, checkForChanges);
            return data;
        } catch (err) {
            logger.error('gradesContext.js', 'fetchGradesData', 'Erreur inattendue', { error: err.message });
            console.error('Erreur:', err);
            setError(err.message || 'Erreur lors du chargement des notes');
            toast.error({
                title: 'Erreur',
                description: err.message || 'Impossible de récupérer vos notes'
            });

            // Essayer de charger les données en cache
            const storedGrades = await getStoredGrades();
            if (storedGrades) {
                processGradesData(storedGrades, false);
            }

            return null;
        } finally {
            setIsLoading(false);
        }
    };

    // Process grades data (common logic for real and demo data)
    const processGradesData = async (gradesData, checkForChanges) => {
        logger.debug('gradesContext.js', 'processGradesData', 'Début du traitement des notes', {
            dataLength: gradesData.length,
            checkForChanges
        });

        // Check for changes if requested
        if (checkForChanges) {
            const storedGrades = await getStoredGrades();
            if (storedGrades) {
                const changes = detectGradeChanges(storedGrades, gradesData);
                if (changes.length > 0) {
                    setHasNewGrades(true);

                    // Notify user of new grades
                    toast.info({
                        title: 'Nouvelles notes disponibles',
                        description: `${changes.length} nouvelle(s) note(s) ajoutée(s)`
                    });
                    logger.info('gradesContext.js', 'processGradesData', 'Nouvelles notes détectées', { changesCount: changes.length });
                }
            }
        }

        // Update data
        setGrades(gradesData);

        // Format data for the app
        const formatted = formatGradesForApp(gradesData);
        setFormattedGrades(formatted);

        // Extract unique courses for filtering
        const uniqueCourses = [...new Set(formatted.map(grade => grade.course))];
        setCourses(['Toutes les matières', ...uniqueCourses]);

        // Store data
        await storeGrades(gradesData);
        const now = new Date().toISOString();
        await AsyncStorage.setItem(LAST_UPDATED_GRADES_KEY, now);
        setLastUpdated(now);
        logger.debug('gradesContext.js', 'processGradesData', 'Traitement des notes terminé');
    };

    // Get demo data when API is not available (matches GradesScreen sample data)
    const getDemoGradesData = () => {
        return [
            {
                "sessionCode": "PEDA-24-09-[LY]-ANG1-011 - Anglais 1",
                "sequenceCode": "PEDA-24-09-[LY]-ANG1-EV-011 - Anglais 1",
                "dateDebut": "02/09/2024",
                "dateFin": "31/08/2025",
                "dateEvaluation": "2024-09-15",
                "libelle": "Public Speaking",
                "bareme": "Classique (/20)",
                "moyenne": 13.331,
                "note": 12,
                "semester": "Semestre 2",
                "coefficient": 1
            },
            {
                "sessionCode": "PEDA-24-09-[LY]-ANG1-011 - Anglais 1",
                "sequenceCode": "PEDA-24-09-[LY]-ANG1-EV-011 - Anglais 1",
                "dateDebut": "02/09/2024",
                "dateFin": "31/08/2025",
                "dateEvaluation": "2024-09-30",
                "libelle": "C&P1",
                "bareme": "Classique (/20)",
                "moyenne": 13.613,
                "note": 12,
                "semester": "Semestre 2",
                "coefficient": 1
            },
            {
                "sessionCode": "PEDA-24-09-[LY]-MATH-011 - Mathématiques 1",
                "sequenceCode": "PEDA-24-09-[LY]-MATH-EV-011 - Mathématiques 1",
                "dateDebut": "02/09/2024",
                "dateFin": "31/08/2025",
                "dateEvaluation": "2024-10-05",
                "libelle": "Contrôle 1",
                "bareme": "Classique (/20)",
                "moyenne": 12.5,
                "note": 15,
                "semester": "Semestre 2",
                "coefficient": 2
            },
            {
                "sessionCode": "PEDA-24-09-[LY]-PHYS-011 - Physique 1",
                "sequenceCode": "PEDA-24-09-[LY]-PHYS-EV-011 - Physique 1",
                "dateDebut": "02/09/2024",
                "dateFin": "31/08/2025",
                "dateEvaluation": "2024-10-12",
                "libelle": "TP Optique",
                "bareme": "Classique (/20)",
                "moyenne": 14.2,
                "note": 16,
                "semester": "Semestre 2",
                "coefficient": 1.5
            }
        ];
    };

    // Retrieve stored grades
    const getStoredGrades = async () => {
        try {
            const storedData = await AsyncStorage.getItem(GRADES_STORAGE_KEY);
            if (storedData) {
                return JSON.parse(storedData);
            }
            return null;
        } catch (err) {
            console.error('Erreur lors de la récupération des notes stockées:', err);
            return null;
        }
    };

    // Store grades
    const storeGrades = async (gradesData) => {
        try {
            await AsyncStorage.setItem(GRADES_STORAGE_KEY, JSON.stringify(gradesData));
        } catch (err) {
            console.error('Erreur lors du stockage des notes:', err);
        }
    };

    // Get average grade for a specific subject or overall
    const calculateAverageGrade = (subject = null, semester = null) => {
        logger.debug('gradesContext.js', 'calculateAverageGrade', 'Calcul de la moyenne', { subject, semester });
        let filteredGrades = [...formattedGrades];

        // Filter by semester if provided
        if (semester) {
            filteredGrades = filteredGrades.filter(grade => grade.semester === semester);
        }

        // Filter by subject if provided
        if (subject && subject !== 'Toutes les matières') {
            filteredGrades = filteredGrades.filter(grade => grade.course === subject);
        }

        if (filteredGrades.length === 0) return 0;

        const totalGrade = filteredGrades.reduce((sum, grade) => {
            return sum + (parseFloat(grade.grade) * (grade.coefficient || 1));
        }, 0);

        const totalCoefficient = filteredGrades.reduce((sum, grade) => {
            return sum + (grade.coefficient || 1);
        }, 0);

        return (totalGrade / totalCoefficient).toFixed(1);
    };

    // Get the best grade for a semester
    const calculateBestGrade = (semester = null) => {
        let filteredGrades = [...formattedGrades];

        if (semester) {
            filteredGrades = filteredGrades.filter(grade => grade.semester === semester);
        }

        if (filteredGrades.length === 0) return 0;

        const best = filteredGrades.reduce((max, grade) => {
            const gradeValue = parseFloat(grade.grade);
            return gradeValue > max ? gradeValue : max;
        }, 0);

        return best;
    };

    // Get the lowest grade for a semester
    const calculateLowestGrade = (semester = null) => {
        let filteredGrades = [...formattedGrades];

        if (semester) {
            filteredGrades = filteredGrades.filter(grade => grade.semester === semester);
        }

        if (filteredGrades.length === 0) return 0;

        const lowest = filteredGrades.reduce((min, grade) => {
            const gradeValue = parseFloat(grade.grade);
            return (min === 0 || gradeValue < min) ? gradeValue : min;
        }, 0);

        return lowest;
    };

    // Get grades filtered by semester and course
    const getFilteredGrades = (semester = null, course = null) => {
        let filtered = [...formattedGrades];

        if (semester) {
            filtered = filtered.filter(grade => grade.semester === semester);
        }

        if (course && course !== 'Toutes les matières') {
            filtered = filtered.filter(grade => grade.course === course);
        }

        return filtered;
    };

    // Get grades sorted by various criteria
    const getSortedGrades = (sortBy = 'date', order = 'desc', semester = null, course = null) => {
        // First filter the grades
        let filtered = getFilteredGrades(semester, course);

        // Then sort them
        return filtered.sort((a, b) => {
            switch (sortBy) {
                case 'value':
                    return order === 'asc' ? a.value - b.value : b.value - a.value;
                case 'subject':
                    return order === 'asc'
                        ? a.subject.localeCompare(b.subject)
                        : b.subject.localeCompare(a.subject);
                default:  // 'date'
                    return order === 'asc'
                        ? a.date - b.date
                        : b.date - a.date;
            }
        });
    };

    // Format the last update date for display
    const getFormattedLastUpdated = () => {
        if (!lastUpdated) return 'Jamais';

        try {
            const date = parseISO(lastUpdated);
            return format(date, 'dd MMMM yyyy à HH:mm', { locale: fr });
        } catch (err) {
            console.error('Erreur de formatage de date:', err);
            return 'Date inconnue';
        }
    };

    // Refresh grades data (force update)
    const refreshGrades = async () => {
        logger.info('gradesContext.js', 'refreshGrades', 'Rafraîchissement des notes');
        return await fetchGradesData(true);
    };

    const getTopThreeGrades = (semester = null) => {
        let filteredGrades = [...formattedGrades];

        // Filtrer par semestre si spécifié
        if (semester) {
            filteredGrades = filteredGrades.filter(grade => grade.semester === semester);
        }

        // Trier les notes par valeur décroissante et prendre les 3 premières
        return filteredGrades
            .sort((a, b) => parseFloat(b.grade) - parseFloat(a.grade))
            .slice(0, 3)
    };

    // Initialize grades data on startup and when authentication changes
    useEffect(() => {
        logger.info('gradesContext.js', 'useEffect', 'Initialisation des notes');
        const initGradesData = async () => {
            if (!isAuthenticated) {
                logger.warn('gradesContext.js', 'useEffect', 'Tentative d\'initialisation sans authentification');
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                // First, retrieve locally stored grades
                const storedGrades = await getStoredGrades();
                const lastUpdatedStr = await AsyncStorage.getItem(LAST_UPDATED_GRADES_KEY);

                if (storedGrades) {
                    // Process stored grades
                    setGrades(storedGrades);
                    const formatted = formatGradesForApp(storedGrades);
                    setFormattedGrades(formatted);

                    // Extract unique courses for filtering
                    const uniqueCourses = [...new Set(formatted.map(grade => grade.course))];
                    setCourses(['Toutes les matières', ...uniqueCourses]);

                    setLastUpdated(lastUpdatedStr);
                    setIsLoading(false);
                }

                // Then fetch fresh data from API
                fetchGradesData();
                logger.info('gradesContext.js', 'useEffect', 'Initialisation terminée');
            } catch (err) {
                logger.error('gradesContext.js', 'useEffect', 'Erreur lors de l\'initialisation', { error: err.message });
                console.error('Erreur d\'initialisation:', err);
                setError('Erreur lors du chargement des données de notes');
                setIsLoading(false);

                // Try to load demo data if everything fails
                const demoData = getDemoGradesData();
                processGradesData(demoData, false);
            }
        };

        initGradesData();
    }, [isAuthenticated]);

    return (
        <GradeContext.Provider
            value={{
                grades,
                formattedGrades,
                isLoading,
                error,
                lastUpdated,
                getFormattedLastUpdated,
                hasNewGrades,
                semesters,
                currentSemester,
                setCurrentSemester,
                courses,
                selectedCourse,
                setSelectedCourse,
                fetchGradesData,
                refreshGrades,
                calculateAverageGrade,
                calculateBestGrade,
                calculateLowestGrade,
                getFilteredGrades,
                getSortedGrades,
                getTopThreeGrades
            }}
        >
            {children}
        </GradeContext.Provider>
    );
};

// Custom hook to use the grade context
export const useGrades = () => useContext(GradeContext);
