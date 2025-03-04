import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const AbsencesFilterModal = ({ filterPeriod, showFilterModal, setShowFilterModal, selectPeriod }) => (
    <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
    >
        <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowFilterModal(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                    <Text style={styles.modalTitle}>Filtrer par période</Text>

                    <TouchableOpacity
                        style={[styles.periodOption, filterPeriod === 'all' && styles.selectedPeriod]}
                        onPress={() => selectPeriod('all')}
                    >
                        <Text style={[styles.periodOptionText, filterPeriod === 'all' && styles.selectedPeriodText]}>
                            Toutes les absences
                        </Text>
                        {filterPeriod === 'all' && (
                            <Ionicons name="checkmark" size={20} color="#4A6FE1" />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.periodOption, filterPeriod === 'week' && styles.selectedPeriod]}
                        onPress={() => selectPeriod('week')}
                    >
                        <Text style={[styles.periodOptionText, filterPeriod === 'week' && styles.selectedPeriodText]}>
                            Cette semaine
                        </Text>
                        {filterPeriod === 'week' && (
                            <Ionicons name="checkmark" size={20} color="#4A6FE1" />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.periodOption, filterPeriod === 'month' && styles.selectedPeriod]}
                        onPress={() => selectPeriod('month')}
                    >
                        <Text style={[styles.periodOptionText, filterPeriod === 'month' && styles.selectedPeriodText]}>
                            Ce mois
                        </Text>
                        {filterPeriod === 'month' && (
                            <Ionicons name="checkmark" size={20} color="#4A6FE1" />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.periodOption, filterPeriod === 'semester' && styles.selectedPeriod]}
                        onPress={() => selectPeriod('semester')}
                    >
                        <Text style={[styles.periodOptionText, filterPeriod === 'semester' && styles.selectedPeriodText]}>
                            Ce semestre
                        </Text>
                        {filterPeriod === 'semester' && (
                            <Ionicons name="checkmark" size={20} color="#4A6FE1" />
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    </Modal>
)

export const AbsencesDetailModal = ({ selectedAbsence, showJustifyModal, setShowJustifyModal, closeAbsenceDetail }) => (
    <Modal
        visible={selectedAbsence !== null && !showJustifyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeAbsenceDetail}
    >
        {selectedAbsence && (
            <View style={styles.detailModalContainer}>
                <View style={styles.detailModalContent}>
                    <View style={styles.detailModalHeader}>
                        <Text style={styles.detailModalTitle}>Détail de l'absence</Text>
                        <TouchableOpacity onPress={closeAbsenceDetail}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.detailScrollView} showsVerticalScrollIndicator={false}>
                        <View style={[styles.detailStatus,
                        { backgroundColor: selectedAbsence.status === 'Justifiée' ? '#66BB6A20' : '#FF8A6520' }]}>
                            <Text style={[styles.detailStatusText,
                            { color: selectedAbsence.status === 'Justifiée' ? '#66BB6A' : '#FF8A65' }]}>
                                {selectedAbsence.status}
                            </Text>
                        </View>

                        <Text style={styles.detailCourse}>{selectedAbsence.course}</Text>

                        <View style={styles.detailInfoSection}>
                            <View style={styles.detailInfoRow}>
                                <View style={styles.detailInfoItem}>
                                    <Ionicons name="calendar" size={20} color="#4A6FE1" />
                                    <Text style={styles.detailInfoLabel}>Date</Text>
                                    <Text style={styles.detailInfoValue}>{selectedAbsence.date}</Text>
                                </View>
                                <View style={styles.detailInfoItem}>
                                    <Ionicons name="time" size={20} color="#4A6FE1" />
                                    <Text style={styles.detailInfoLabel}>Horaire</Text>
                                    <Text style={styles.detailInfoValue}>{selectedAbsence.time}</Text>
                                </View>
                            </View>

                            <View style={styles.detailInfoRow}>
                                <View style={styles.detailInfoItem}>
                                    <Ionicons name="location" size={20} color="#4A6FE1" />
                                    <Text style={styles.detailInfoLabel}>Salle</Text>
                                    <Text style={styles.detailInfoValue}>{selectedAbsence.room}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Section des enseignants */}
                        <View style={styles.teachersSection}>
                            <Text style={styles.teachersSectionTitle}>Enseignants</Text>
                            <View style={styles.teachersList}>
                                {selectedAbsence.teacher.split(', ').map((teacher, index) => (
                                    <View key={index} style={styles.teacherItem}>
                                        <Ionicons name="person" size={16} color="#4A6FE1" />
                                        <Text style={styles.teacherName}>{teacher}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {selectedAbsence.status === 'Justifiée' && selectedAbsence.justificationDate && (
                            <View style={styles.justificationInfo}>
                                <Ionicons name="checkmark-circle" size={20} color="#66BB6A" />
                                <Text style={styles.justificationInfoText}>
                                    Justifiée le {selectedAbsence.justificationDate}
                                </Text>
                            </View>
                        )}

                        {selectedAbsence.status === 'Non justifiée' && (
                            <TouchableOpacity
                                style={styles.detailJustifyButton}
                                onPress={() => setShowJustifyModal(true)}
                            >
                                <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />
                                <Text style={styles.detailJustifyButtonText}>Soumettre un justificatif</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </View>
            </View>
        )}
    </Modal>
)

export const AbsencesJustifyModal = ({ selectedAbsence, showJustifyModal, justificationFile, setShowJustifyModal, justifyAbsence, closeAbsenceDetail }) => (
    <Modal
        visible={showJustifyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowJustifyModal(false)}
    >
        <View style={styles.detailModalContainer}>
            <View style={styles.detailModalContent}>
                <View style={styles.detailModalHeader}>
                    <Text style={styles.detailModalTitle}>Justifier l'absence</Text>
                    <TouchableOpacity onPress={() => setShowJustifyModal(false)}>
                        <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                </View>

                {selectedAbsence && (
                    <>
                        <Text style={styles.justifyModalCourse}>
                            {selectedAbsence.course} - {selectedAbsence.date}
                        </Text>

                        <View style={styles.uploadSection}>
                            <View style={styles.uploadBox}>
                                <Ionicons name="cloud-upload" size={40} color="#4A6FE1" />
                                <Text style={styles.uploadText}>
                                    {justificationFile ?
                                        justificationFile.name :
                                        "Aucun fichier sélectionné"}
                                </Text>
                                <Text style={styles.uploadSubtext}>
                                    Formats acceptés: PDF, JPG, PNG
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={styles.browseButton}
                                onPress={justifyAbsence}
                            >
                                <Text style={styles.browseButtonText}>Parcourir</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.justifyButtonsContainer}>
                            <TouchableOpacity
                                style={[styles.justifyActionButton, styles.cancelButton]}
                                onPress={() => setShowJustifyModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.justifyActionButton, styles.submitButton]}
                                onPress={() => {
                                    if (justificationFile) {
                                        alert('Justificatif envoyé avec succès !');
                                        setShowJustifyModal(false);
                                        closeAbsenceDetail();
                                    } else {
                                        alert('Veuillez sélectionner un fichier');
                                    }
                                }}
                            >
                                <Text style={styles.submitButtonText}>Envoyer</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>
        </View>
    </Modal>
)


const styles = StyleSheet.create({
    modalOverlay: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        top: 0,
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    modalContainer: {
        width: '100%',
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(0,0,0,0.1)',
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
    },
    modalContent: {
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
    },
    periodOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    selectedPeriod: {
        paddingHorizontal: 10,
        borderRadius: 12,
        backgroundColor: '#4A6FE110',
    },
    periodOptionText: {
        fontSize: 16,
        color: '#333',
    },
    selectedPeriodText: {
        color: '#4A6FE1',
        fontWeight: '600',
    },
    detailModalContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flex: 1,
        justifyContent: 'flex-end',
    },
    detailModalContent: {
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: 'rgba(0,0,0,0.1)',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '80%',
    },
    detailModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    detailModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    detailScrollView: {
        flexGrow: 1,
    },
    detailStatus: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 15,
    },
    detailStatusText: {
        fontSize: 14,
        fontWeight: '600',
    },
    detailCourse: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
    },
    detailInfoSection: {
        backgroundColor: '#F5F7FA',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
    },
    detailInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    detailInfoItem: {
        width: '48%',
        alignItems: 'center',
    },
    detailInfoLabel: {
        fontSize: 14,
        color: '#757575',
        marginTop: 5,
    },
    detailInfoValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginTop: 5,
        textAlign: 'center',
    },
    teachersSection: {
        backgroundColor: '#F5F7FA',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
    },
    teachersSectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    teachersList: {
        flexDirection: 'column',
    },
    teacherItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    teacherName: {
        fontSize: 16,
        color: '#333',
        marginLeft: 10,
    },
    justificationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#66BB6A20',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
    },
    justificationInfoText: {
        fontSize: 16,
        color: '#66BB6A',
        marginLeft: 10,
    },
    detailJustifyButton: {
        backgroundColor: '#4A6FE1',
        borderRadius: 10,
        paddingVertical: 15,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailJustifyButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginLeft: 10,
    },
    justifyModalCourse: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 20,
    },
    uploadSection: {
        marginBottom: 20,
    },
    uploadBox: {
        height: 150,
        backgroundColor: '#F5F7FA',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    uploadText: {
        fontSize: 16,
        color: '#333',
        marginTop: 10,
        marginBottom: 5,
    },
    uploadSubtext: {
        fontSize: 14,
        color: '#757575',
    },
    browseButton: {
        backgroundColor: '#4A6FE120',
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
    },
    browseButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4A6FE1',
    },
    justifyButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    justifyActionButton: {
        width: '48%',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#F5F7FA',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    submitButton: {
        backgroundColor: '#4A6FE1',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
