import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView, StatusBar, TextInput, Modal, ActivityIndicator, RefreshControl, Pressable } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useToast } from '../../hooks/useToast';
import logger from '../../services/logger';
import CustomAlert from '../../components/alert/CustomAlert';

const LogsViewerPage = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const toast = useToast();

    // States
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLogLevel, setSelectedLogLevel] = useState(null);
    const [dateSort, setDateSort] = useState('desc'); // 'asc' or 'desc'
    const [selectedLog, setSelectedLog] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const [showDeleteAlert, setShowDeleteAlert] = useState(false)

    // Log level colors
    const logLevelColors = {
        DEBUG: '#8A2BE2', // Violet
        INFO: '#4A6FE1',  // Bleu principal
        WARN: '#FF9500',  // Orange
        ERROR: '#FF3B30'  // Rouge
    };

    // Fetch logs
    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            const allLogs = await logger.getAllLogs();
            // Parsing des fichiers de logs pour créer un tableau unifié
            const parsedLogs = [];

            allLogs.forEach(logFile => {
                const lines = logFile.content.split('\n').filter(line => line.trim() !== '');

                lines.forEach(line => {
                    try {
                        // Parse du format [timestamp][LEVEL][fichier:fonction] message | data
                        const matches = line.match(/\[(.*?)\]\[(.*?)\]\[(.*?)\](.*)/);

                        if (matches && matches.length >= 5) {
                            const timestamp = matches[1];
                            const level = matches[2];
                            const context = matches[3]; // fichier:fonction
                            let message = matches[4].trim();
                            let data = null;

                            // Extraction du contexte (fichier:fonction)
                            const [fileContext, functionContext] = context.split(':');

                            // Extraction des données si présentes
                            const dataSeparator = message.indexOf(' | ');
                            if (dataSeparator !== -1) {
                                data = message.substring(dataSeparator + 3);
                                message = message.substring(0, dataSeparator);

                                try {
                                    data = JSON.parse(data);
                                } catch (e) {
                                    // Si le parsing échoue, on garde la donnée sous forme de string
                                }
                            }

                            parsedLogs.push({
                                id: `${timestamp}-${Math.random().toString(16).slice(2)}`,
                                timestamp,
                                level,
                                fileContext,
                                functionContext,
                                message,
                                data,
                                rawLog: line,
                                date: new Date(timestamp)
                            });
                        }
                    } catch (e) {
                        console.error('Erreur de parsing de log:', e);
                    }
                });
            });

            // Tri par date (du plus récent au plus ancien par défaut)
            const sortedLogs = parsedLogs.sort((a, b) => b.date - a.date);

            setLogs(sortedLogs);
            setFilteredLogs(sortedLogs);
        } catch (error) {
            toast.error('Erreur lors du chargement des logs');
            console.error('Erreur de chargement des logs:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
        // Retirer toast des dépendances pour éviter les re-renders en cascade
    }, []);

    const clearLogs = async () => {
        try {
            const result = await logger.clearAllLogs()
            if (result) {
                toast.success('Suppresion réussi', 'Tous les logs ont été supprimés');
            } else {
                toast.error('Error lors de la suppression', 'Une erreur est survenue lors de la suppression des logs');
            }
        } catch (error) {
            toast.error('Error lors de la suppression', error.message);
        }
    }

    // Utiliser un ref pour éviter les appels multiples lors du premier rendu
    const initialLoadRef = React.useRef(false);

    // Initialisation au montage uniquement
    useEffect(() => {
        if (!initialLoadRef.current) {
            initialLoadRef.current = true;
            fetchLogs();
        }
    }, []);

    // Rafraîchissement seulement au focus, sans dépendre de fetchLogs
    useFocusEffect(
        useCallback(() => {
            // Éviter le double chargement avec l'effet initial
            if (initialLoadRef.current) {
                fetchLogs();
            }

            return () => {
                // Cleanup si nécessaire
            };
        }, [])
    );

    // Handle refresh
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchLogs();
    }, [fetchLogs]);

    // Filtres et recherche
    useEffect(() => {
        let result = [...logs];

        // Filtre par niveau de log
        if (selectedLogLevel) {
            result = result.filter(log => log.level === selectedLogLevel);
        }

        // Recherche textuelle
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                log => log.message.toLowerCase().includes(query) ||
                    (log.data && JSON.stringify(log.data).toLowerCase().includes(query))
            );
        }

        // Tri par date
        result = result.sort((a, b) => {
            if (dateSort === 'asc') {
                return a.date - b.date;
            } else {
                return b.date - a.date;
            }
        });

        setFilteredLogs(result);
    }, [logs, selectedLogLevel, searchQuery, dateSort]);

    // Export logs
    const handleExportLogs = async () => {
        try {
            setLoading(true);
            const success = await logger.exportLogs();

            if (success) {
                toast.success('Logs exportés avec succès');
            } else {
                toast.error('Échec de l\'export des logs');
            }
        } catch (error) {
            toast.error('Erreur lors de l\'export des logs');
            console.error('Erreur export logs:', error);
        } finally {
            setLoading(false);
        }
    };

    // Clear filters
    const clearFilters = () => {
        setSearchQuery('');
        setSelectedLogLevel(null);
    };

    // Toggle date sort
    const toggleDateSort = () => {
        setDateSort(dateSort === 'asc' ? 'desc' : 'asc');
    };

    // View log details
    const viewLogDetails = (log) => {
        setSelectedLog(log);
        setModalVisible(true);
    };

    // Format date function
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    // Render log item
    const renderLogItem = ({ item }) => (
        <TouchableOpacity
            style={styles.logItem}
            onPress={() => viewLogDetails(item)}
            activeOpacity={0.7}
        >
            <View style={styles.logHeader}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={[styles.levelIndicator, { backgroundColor: logLevelColors[item.level] || '#999' }]}>
                        <Text style={styles.levelText}>{item.level}</Text>
                    </View>
                    <View style={[styles.levelIndicator, { backgroundColor:  '#999' }]}>
                        <Text style={styles.levelText}>{item.fileContext}</Text>
                    </View>
                </View>
                <Text style={styles.timestamp}>{formatDate(item.timestamp)}</Text>
            </View>
            <Text style={styles.logMessage} numberOfLines={2}>{item.message}</Text>
            {item.data && (
                <Text style={styles.logData} numberOfLines={1}>
                    {typeof item.data === 'object' ? JSON.stringify(item.data).slice(0, 50) + '...' : item.data}
                </Text>
            )}
        </TouchableOpacity>
    );

    // Render log filter pill
    const renderFilterPill = (level, label) => (
        <TouchableOpacity
            style={[
                styles.filterPill,
                selectedLogLevel === level ? { backgroundColor: logLevelColors[level] || '#4A6FE1' } : null
            ]}
            onPress={() => setSelectedLogLevel(selectedLogLevel === level ? null : level)}
        >
            <Text style={[
                styles.filterPillText,
                selectedLogLevel === level ? { color: '#FFFFFF' } : { color: logLevelColors[level] || '#4A6FE1' }
            ]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    // Render detail modal
    const renderDetailModal = () => (
        <Modal
            visible={modalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setModalVisible(false)}
        >
            <Pressable style={styles.modalContainer} onPress={() => setModalVisible(false)}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Détails du log</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Ionicons name="close-circle" size={24} color="#757575" />
                        </TouchableOpacity>
                    </View>

                    {selectedLog && (
                        <View style={styles.logDetails}>
                            <View style={{ flexDirection: 'row', gap: 5, flexWrap: 'wrap', marginBottom: 15 }}>
                                <View style={[styles.detailLevelIndicator, { backgroundColor: logLevelColors[selectedLog.level] || '#999' }]}>
                                    <Text style={styles.detailLevelText}>{selectedLog.level}</Text>
                                </View>
                                <View style={[styles.detailLevelIndicator, { backgroundColor: '#D36E70' }]}>
                                    <Text style={styles.detailLevelText}>{selectedLog.fileContext}</Text>
                                </View>
                                <View style={[styles.detailLevelIndicator, { backgroundColor: '#00BB2D' }]}>
                                    <Text style={styles.detailLevelText}>{selectedLog.functionContext}()</Text>
                                </View>
                            </View>

                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Date:</Text>
                                <Text style={styles.detailValue}>{formatDate(selectedLog.timestamp)}</Text>
                            </View>

                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Message:</Text>
                                <Text style={styles.detailValue}>{selectedLog.message}</Text>
                            </View>

                            {selectedLog.data && (
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Données:</Text>
                                    <Text style={styles.detailValue}>
                                        {typeof selectedLog.data === 'object'
                                            ? JSON.stringify(selectedLog.data, null, 2)
                                            : selectedLog.data}
                                    </Text>
                                </View>
                            )}

                            <TouchableOpacity
                                style={styles.copyButton}
                                onPress={async () => {
                                    try {
                                        const logContent = `[${formatDate(selectedLog.timestamp)}][${selectedLog.level}] ${selectedLog.message}${selectedLog.data
                                            ? ' | ' + (typeof selectedLog.data === 'object'
                                                ? JSON.stringify(selectedLog.data, null, 2)
                                                : selectedLog.data)
                                            : ''
                                            }`;
                                        await Clipboard.setStringAsync(logContent);
                                        toast.info('Log copié dans le presse-papier');
                                    } catch (error) {
                                        toast.error('Erreur lors de la copie');
                                    }
                                }}
                            >
                                <Ionicons name="copy-outline" size={16} color="#FFFFFF" />
                                <Text style={styles.copyButtonText}>Copier</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </Pressable>
        </Modal>
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
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Logs du système</Text>
                    <View style={{ flexDirection: 'row', gap: 15, alignItems: 'center' }}>
                        <TouchableOpacity onPress={handleExportLogs} style={styles.exportButton}>
                            <Ionicons name="download-outline" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.fab2}
                            onPress={() => setShowDeleteAlert(true)}
                        >
                            <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>

            {/* Search and Filter Section */}
            <View style={styles.searchSection}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#757575" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Rechercher dans les logs..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#757575"
                    />
                    {searchQuery !== '' && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color="#757575" />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.filtersRow}>
                    <View style={styles.filterPills}>
                        {renderFilterPill('DEBUG', 'Debug')}
                        {renderFilterPill('INFO', 'Info')}
                        {renderFilterPill('WARN', 'Warn')}
                        {renderFilterPill('ERROR', 'Error')}
                    </View>

                    <TouchableOpacity style={styles.sortButton} onPress={toggleDateSort}>
                        <Ionicons
                            name={dateSort === 'desc' ? 'arrow-down' : 'arrow-up'}
                            size={18}
                            color="#4A6FE1"
                        />
                    </TouchableOpacity>
                </View>

                {/* Results info and clear filters */}
                <View style={styles.resultsInfo}>
                    <Text style={styles.resultsCount}>
                        {filteredLogs.length} logs {selectedLogLevel ? `(${selectedLogLevel})` : ''}
                    </Text>

                    {(selectedLogLevel || searchQuery) && (
                        <TouchableOpacity onPress={clearFilters}>
                            <Text style={styles.clearFilters}>Effacer les filtres</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Logs List */}
            {loading && !refreshing ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#4A6FE1" />
                    <Text style={styles.loaderText}>Chargement des logs...</Text>
                </View>
            ) : (
                <>
                    {filteredLogs.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="document-text-outline" size={60} color="#CCCCCC" />
                            <Text style={styles.emptyText}>Aucun log trouvé</Text>
                            <Text style={styles.emptySubtext}>
                                Modifiez vos critères de recherche ou essayez plus tard
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={filteredLogs}
                            renderItem={renderLogItem}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.logsList}
                            showsVerticalScrollIndicator={false}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={onRefresh}
                                    colors={['#4A6FE1']}
                                />
                            }
                        />
                    )}
                </>
            )}

            {/* Log Detail Modal */}
            {renderDetailModal()}

            <CustomAlert
                visible={showDeleteAlert}
                onClose={() => setShowDeleteAlert(false)}
                type="warning"
                title="Confirmer la suppression"
                message="Êtes-vous sûr de vouloir supprimer tous les logs ?"
                buttons={
                    [
                        { text: 'Annuler', style: 'cancel' },
                        {
                            text: 'Supprimer',
                            style: 'confirm',
                            onPress: () => {
                                clearLogs();
                                fetchLogs();
                            }
                        }
                    ]
                }
                dismissable
            />
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
        paddingBottom: 25,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backButton: {
        padding: 5,
    },
    exportButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    searchSection: {
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 5,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: '#333',
    },
    filtersRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 12,
    },
    filterPills: {
        flexDirection: 'row',
    },
    filterPill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#DFE7F5',
        backgroundColor: '#FFFFFF',
    },
    filterPillText: {
        fontSize: 12,
        fontWeight: '500',
    },
    sortButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DFE7F5',
    },
    resultsInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingHorizontal: 2,
    },
    resultsCount: {
        fontSize: 12,
        color: '#757575',
    },
    clearFilters: {
        fontSize: 12,
        color: '#4A6FE1',
        fontWeight: '500',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loaderText: {
        marginTop: 10,
        color: '#757575',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#757575',
        textAlign: 'center',
        marginTop: 8,
    },
    logsList: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 80,
    },
    logItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    logHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    levelIndicator: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 5,
    },
    levelText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    timestamp: {
        fontSize: 11,
        color: '#757575',
    },
    logMessage: {
        fontSize: 14,
        color: '#333',
        marginBottom: 6,
    },
    logData: {
        fontSize: 12,
        color: '#757575',
        fontFamily: 'monospace',
    },
    fab: {
        position: 'absolute',
        bottom: 80,
        right: 10,
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    fab2: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 35,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    logDetails: {
        backgroundColor: '#F8F9FB',
        borderRadius: 12,
        padding: 15,
    },
    detailLevelIndicator: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 5,
        // marginBottom: 15,
    },
    detailLevelText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    detailItem: {
        marginBottom: 15,
    },
    detailLabel: {
        fontSize: 12,
        color: '#757575',
        marginBottom: 3,
    },
    detailValue: {
        fontSize: 14,
        color: '#333',
        fontFamily: 'monospace',
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4A6FE1',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 15,
        alignSelf: 'flex-end',
        marginTop: 10,
    },
    copyButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#FFFFFF',
        marginLeft: 5,
    },
});

export default LogsViewerPage;
