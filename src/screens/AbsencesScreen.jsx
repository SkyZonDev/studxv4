import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/themeContext';
import AbsencesCard from '../components/card/AbsencesCard';
import { AbsencesFilterModal, AbsencesDetailModal, AbsencesJustifyModal } from '../components/modal/AbsencesModal';
import * as DocumentPicker from 'expo-document-picker';
import { useAbsences } from '../context/absencesContext';
import useToast from '../hooks/useToast';

const AbsencesScreen = () => {
    const { colors } = useTheme();
    const toast = useToast();
    const insets = useSafeAreaInsets();

    // Utiliser le contexte des absences au lieu des états locaux
    const {
        // Données et états
        filteredAbsences,
        isLoading,
        isRefreshing,
        searchQuery,
        filterPeriod,
        stats,

        // Actions
        refreshAbsences,
        setSearchQuery,
        setFilterPeriod,
        submitJustification,

        // Utilitaires
        getTotalHours,
        adaptAbsenceForDisplay,

        // Constantes
        FILTER_PERIODS
    } = useAbsences();

    // États locaux pour les modaux et l'absence sélectionnée
    const [selectedAbsence, setSelectedAbsence] = React.useState(null);
    const [showFilterModal, setShowFilterModal] = React.useState(false);
    const [showJustifyModal, setShowJustifyModal] = React.useState(false);
    const [justificationFile, setJustificationFile] = React.useState(null);

    // Fonction pour sélectionner une période
    const selectPeriod = (period) => {
        setFilterPeriod(period);
        setShowFilterModal(false);
    };

    // Fonction pour ouvrir le détail d'une absence
    const openAbsenceDetail = (absence) => {
        setSelectedAbsence(adaptAbsenceForDisplay(absence));
    };

    // Fonction pour fermer le détail d'une absence
    const closeAbsenceDetail = () => {
        setSelectedAbsence(null);
    };

    // Fonction pour justifier une absence
    const justifyAbsence = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
            });

            if (result.type === 'success') {
                setJustificationFile(result);
                // Utiliser la fonction du contexte pour soumettre le justificatif
                const success = await submitJustification(selectedAbsence.id, result);
                if (success) {
                    setShowJustifyModal(false);
                    closeAbsenceDetail();
                }
            }
        } catch (error) {
            ('Erreur lors du téléchargement:', error);
        }
    };

    const handleSearch = () => {
        toast.info('Fonctionnalité en développement', {
            duration: 3000,
            position: toast.positions.TOP
        });
    }

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
        headerButton: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            justifyContent: 'center',
            alignItems: 'center',
            marginLeft: 10
        },
        headerTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: colors.primary.contrast,
        },
        content: {
            flex: 1,
            paddingHorizontal: 20,
            paddingTop: 20,
        },
        searchContainer: {
            flexDirection: 'row',
            marginBottom: 20,
        },
        searchBar: {
            flex: 1,
            height: 50,
            backgroundColor: colors.surface,
            borderRadius: 10,
            paddingHorizontal: 15,
            flexDirection: 'row',
            alignItems: 'center',
            marginRight: 10,
            elevation: 2,
        },
        searchInput: {
            flex: 1,
            height: 50,
            marginLeft: 10,
            fontSize: 16,
        },
        filterButton: {
            width: 50,
            height: 50,
            backgroundColor: colors.surface,
            borderRadius: 10,
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 2,
        },
        statsContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 20,
        },
        statCard: {
            width: '31%',
            borderRadius: 10,
            padding: 10,
            alignItems: 'center',
        },
        statNumber: {
            fontSize: 24,
            fontWeight: 'bold',
            color: colors.primary.main,
            marginBottom: 5,
        },
        statLabel: {
            fontSize: 12,
            color: colors.primary.main,
        },
        periodContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 20,
        },
        periodLabel: {
            fontSize: 16,
            fontWeight: 'bold',
            color: colors.text.primary,
            marginRight: 10,
        },
        periodValue: {
            fontSize: 16,
            color: colors.primary.main,
            fontWeight: '500',
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: colors.text.primary,
            marginBottom: 15,
        },
        absencesList: {
            flex: 1,
        },
        emptyState: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 50,
        },
        emptyStateTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: colors.text.primary,
            marginTop: 20,
            marginBottom: 10,
        },
        emptyStateText: {
            fontSize: 16,
            color: colors.text.tertiary,
            textAlign: 'center',
            maxWidth: '80%',
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
                    <Text style={styles.headerTitle}>Mes absences</Text>
                    <View style={{
                        flexDirection: 'row'
                    }}>
                        <TouchableOpacity style={styles.headerButton} onPress={() => handleSearch()}>
                            <Ionicons name="search" size={24} color={colors.primary.contrast} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.headerButton} onPress={() => setShowFilterModal(true)}>
                            <Ionicons name="funnel" size={20} color={colors.primary.contrast} />
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>

            <View style={styles.content}>

                {/* Statistics Cards */}
                <View style={styles.statsContainer}>
                    <View style={[styles.statCard, { backgroundColor: '#4A6FE120' }]}>
                        <Text style={styles.statNumber}>{stats.total}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#66BB6A20' }]}>
                        <Text style={[styles.statNumber, { color: '#66BB6A' }]}>{stats.justified}</Text>
                        <Text style={[styles.statLabel, { color: '#66BB6A' }]}>Justifiées</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#FF8A6520' }]}>
                        <Text style={[styles.statNumber, { color: '#FF8A65' }]}>{stats.unjustified}</Text>
                        <Text style={[styles.statLabel, { color: '#FF8A65' }]}>Non justifiées</Text>
                    </View>
                </View>

                {/* Period Selected */}
                <View style={styles.periodContainer}>
                    <Text style={styles.periodLabel}>Période :</Text>
                    <Text style={styles.periodValue}>
                        {filterPeriod === FILTER_PERIODS.ALL && 'Toutes les absences'}
                        {filterPeriod === FILTER_PERIODS.WEEK && 'Cette semaine'}
                        {filterPeriod === FILTER_PERIODS.MONTH && 'Ce mois'}
                        {filterPeriod === FILTER_PERIODS.SEMESTER && 'Ce semestre'}
                    </Text>
                </View>

                {/* Absences List */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Text style={styles.sectionTitle}>
                        {filteredAbsences.length} absence{filteredAbsences.length > 1 ? 's' : ''}
                        {filterPeriod === FILTER_PERIODS.WEEK ? ' cette semaine' : ''}
                        {filterPeriod === FILTER_PERIODS.MONTH ? ' ce mois' : ''}
                    </Text>
                    <Text style={{
                        color: colors.primary.main,
                        marginLeft: 10,
                        marginBottom: 14,
                        fontStyle: 'italic'
                    }}>({getTotalHours(filteredAbsences)}h totals)</Text>
                </View>

                <ScrollView
                    style={styles.absencesList}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={refreshAbsences}
                            colors={[colors.primary.main]}
                        />
                    }
                >
                    {isLoading && filteredAbsences.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>Chargement des absences...</Text>
                        </View>
                    ) : filteredAbsences.length > 0 ? (
                        filteredAbsences.map(absence => (
                            <AbsencesCard
                                key={absence.id}
                                absence={adaptAbsenceForDisplay(absence)}
                                openAbsenceDetail={() => openAbsenceDetail(absence)}
                                setSelectedAbsence={() => setSelectedAbsence(adaptAbsenceForDisplay(absence))}
                                setShowJustifyModal={setShowJustifyModal}
                                colors={colors}
                            />
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="checkmark-circle" size={50} color="#4A6FE1" />
                            <Text style={styles.emptyStateTitle}>Aucune absence trouvée</Text>
                            <Text style={styles.emptyStateText}>
                                Vous n'avez aucune absence correspondant à vos critères de recherche.
                            </Text>
                        </View>
                    )}
                    <View style={{ height: 100 }} />
                </ScrollView>
            </View>

            {/* Filter Modal */}
            <AbsencesFilterModal
                filterPeriod={filterPeriod}
                showFilterModal={showFilterModal}
                setShowFilterModal={setShowFilterModal}
                selectPeriod={selectPeriod}
                colors={colors}
            />

            {/* Absence Detail Modal */}
            <AbsencesDetailModal
                selectedAbsence={selectedAbsence}
                showJustifyModal={showJustifyModal}
                setShowJustifyModal={setShowJustifyModal}
                closeAbsenceDetail={closeAbsenceDetail}
                colors={colors}
            />

            {/* Justify Modal */}
            <AbsencesJustifyModal
                selectedAbsence={selectedAbsence}
                showJustifyModal={showJustifyModal}
                justificationFile={justificationFile}
                setShowJustifyModal={setShowJustifyModal}
                justifyAbsence={justifyAbsence}
                closeAbsenceDetail={closeAbsenceDetail}
                colors={colors}
            />
        </SafeAreaView>
    );
};

export default AbsencesScreen;
