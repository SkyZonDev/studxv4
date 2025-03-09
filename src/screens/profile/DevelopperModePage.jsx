import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Switch, TextInput, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useToast } from '../../hooks/useToast';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import NetInfo from '@react-native-community/netinfo';
import { useUser } from '../../context/userContext';

const DeveloperModePage = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const toast = useToast();
    const { getUniqueID } = useUser();

    // State variables
    const [showEnvironment, setShowEnvironment] = useState(false);
    const [apiEndpoint, setApiEndpoint] = useState('https://studx.ddns.net/api/v1');
    const [networkStatus, setNetworkStatus] = useState(null);
    const [expandedSection, setExpandedSection] = useState(null);
    const [uniqueID, setUniqueID] = useState(false)

    // Animation values
    const [sectionAnimations] = useState({
        device: new Animated.Value(0),
        config: new Animated.Value(0),
        network: new Animated.Value(0)
    });

    useEffect(() => {
        const getID = async () => {
            const result = await getUniqueID();
            setUniqueID(result)
        }

        getID();
    }, [])

    useEffect(() => {
        // Vérifier le statut réseau
        checkNetworkStatus();

        // Souscrire aux changements de statut réseau
        const unsubscribe = NetInfo.addEventListener(state => {
            setNetworkStatus(state);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        // Animation d'expansion des sections
        Object.keys(sectionAnimations).forEach(section => {
            Animated.timing(sectionAnimations[section], {
                toValue: expandedSection === section ? 1 : 0,
                duration: 300,
                useNativeDriver: false
            }).start();
        });
    }, [expandedSection]);

    const checkNetworkStatus = async () => {
        const status = await NetInfo.fetch();
        setNetworkStatus(status);
    };

    const testApiConnection = async () => {
        try {
            const { success, error } = toast.loading('Test de connexion en cours...');

            fetch(`${apiEndpoint}/health`)
                .then(() => {
                    success("API en ligne", "Requête effectué avec succès !");
                })
                .catch(() => {
                    error("API hors ligne", "La requpete n'a pu aboutir");
                })

        } catch (error) {
            toast.error('Échec de la connexion à l\'API');
        }
    };

    const toggleExpandSection = (section) => {
        if (expandedSection === section) {
            setExpandedSection(null);
        } else {
            setExpandedSection(section);
        }
    };

    const getCleanOSName = () => {
        if (Platform.OS === 'android') {
            return 'Android';
        } else if (Platform.OS === 'ios') {
            return 'iOS';
        } else {
            return 'Unknown OS';
        }
    };


    const renderDeviceInfo = () => {
        return (
            <View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>OS:</Text>
                    <Text style={styles.infoValue}>{getCleanOSName()} {Device.osVersion}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Appareil:</Text>
                    <Text style={styles.infoValue}>{Device.modelName}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>App Version:</Text>
                    <Text style={styles.infoValue}>{Constants.expoConfig?.version || Constants.manifest.version || '1.0.0'}</Text>
                </View>
                <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.infoLabel}>Unique ID:</Text>
                    <Text style={styles.infoValue}>{uniqueID}</Text>
                </View>
            </View>
        );
    };

    const renderEnvironmentVariables = () => {
        // Remplacer par vos propres variables d'environnement
        const envVars = {
            API_URL: apiEndpoint,
            NODE_ENV: __DEV__ ? 'development' : 'production',
            APP_VERSION: Constants.expoConfig?.version || '1.0.0',
        };

        return (
            <View style={styles.infoContainer}>
                {Object.entries(envVars).map(([key, value]) => (
                    <View key={key} style={styles.infoRow}>
                        <Text style={styles.infoLabel}>{key}:</Text>
                        <Text style={styles.infoValue}>{value}</Text>
                    </View>
                ))}
            </View>
        );
    };

    const renderNetworkInfo = () => {
        if (!networkStatus) return null;

        return (
            <View style={styles.infoContainer}>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Connecté:</Text>
                    <View style={styles.statusContainer}>
                        <View style={[
                            styles.statusIndicator,
                            { backgroundColor: networkStatus.isConnected ? '#4CAF50' : '#F44336' }
                        ]} />
                        <Text style={styles.infoValue}>{networkStatus.isConnected ? 'Oui' : 'Non'}</Text>
                    </View>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Type:</Text>
                    <Text style={styles.infoValue}>{networkStatus.type}</Text>
                </View>
                {networkStatus.type === 'wifi' && (
                    <>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>SSID:</Text>
                            <Text style={styles.infoValue}>{networkStatus.details?.ssid || 'N/A'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Force:</Text>
                            <Text style={styles.infoValue}>{networkStatus.details?.strength || 'N/A'}</Text>
                        </View>
                    </>
                )}
                {networkStatus.type === 'cellular' && (
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Cellulaire:</Text>
                        <Text style={styles.infoValue}>{networkStatus.details?.cellularGeneration || 'N/A'}</Text>
                    </View>
                )}
            </View>
        );
    };

    const getSectionMaxHeight = (section) => {
        return sectionAnimations[section].interpolate({
            inputRange: [0, 1],
            outputRange: [0, 500]
        });
    };

    const goToSettingPage = (page) => {
        // Cette fonction serait utilisée pour naviguer vers la page de logs
        navigation.navigate(page);
    };

    const clearAppCache = async () => {
        try {
            const cacheDirectory = FileSystem.cacheDirectory;
            const documentsDirectory = FileSystem.documentDirectory;

            // Suppression des fichiers dans le répertoire cache
            if (cacheDirectory) {
                await FileSystem.deleteAsync(cacheDirectory, { idempotent: true });
            }

            // Suppression des fichiers temporaires dans le répertoire documents
            if (documentsDirectory) {
                const files = await FileSystem.readDirectoryAsync(documentsDirectory);
                for (const file of files) {
                    if (file.startsWith('tmp-') || file.endsWith('.tmp')) {
                        await FileSystem.deleteAsync(`${documentsDirectory}${file}`, { idempotent: true });
                    }
                }
            }

            toast.success('Cache effacé avec succès', {
                duration: 2500,
                position: toast.positions.TOP
            });
        } catch (error) {
            console.error('Erreur lors du nettoyage du cache:', error);
            toast.error('Erreur lors du nettoyage du cache', {
                duration: 2500,
                position: toast.positions.TOP
            });
        }
    };

    const clearAppData = async () => {
        try {
            // Afficher un toast de chargement
            const { success, error } = toast.loading('Suppression des données en cours...');

            // 1. Effacer AsyncStorage
            await AsyncStorage.clear();

            // 2. Nettoyer les fichiers avec gestion d'erreurs
            try {
                const cacheDirectory = FileSystem.cacheDirectory;
                const documentsDirectory = FileSystem.documentDirectory;

                // Nettoyer les fichiers du cache un par un
                if (cacheDirectory) {
                    const cacheFiles = await FileSystem.readDirectoryAsync(cacheDirectory);
                    await Promise.all(
                        cacheFiles.map(async (file) => {
                            try {
                                await FileSystem.deleteAsync(`${cacheDirectory}${file}`, { idempotent: true });
                            } catch (e) {
                                console.log(`Impossible de supprimer le fichier cache: ${file}`);
                            }
                        })
                    );
                }

                // Nettoyer les fichiers documents
                if (documentsDirectory) {
                    const docFiles = await FileSystem.readDirectoryAsync(documentsDirectory);
                    await Promise.all(
                        docFiles.map(async (file) => {
                            try {
                                await FileSystem.deleteAsync(`${documentsDirectory}${file}`, { idempotent: true });
                            } catch (e) {
                                console.log(`Impossible de supprimer le fichier document: ${file}`);
                            }
                        })
                    );
                }
            } catch (e) {
                console.warn('Erreur pendant le nettoyage des fichiers:', e);
            }

            // 3. Réinitialiser les états de l'application
            setApiEndpoint('https://studx.ddns.net/api/v1');
            setShowEnvironment(false);
            setExpandedSection(null);

            // 4. Afficher un message de succès
            success('Données effacées', 'Les données ont été supprimées');

            // 5. Demander un redémarrage manuel
            setTimeout(() => {
                toast.info('Veuillez redémarrer l\'application pour appliquer les changements', {
                    duration: 3000,
                    position: toast.positions.TOP
                });
            }, 1000);

        } catch (error) {
            console.error('Erreur lors de la suppression des données:', error);
            toast.error('Erreur partielle lors de la suppression', {
                duration: 2500,
                position: toast.positions.TOP
            });
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

            {/* Header with Gradient */}
            <LinearGradient
                colors={['#5E72E4', '#825EE4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.header, { paddingTop: insets.top + 10 }]}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Mode Développeur</Text>
                    <View style={styles.refreshButton} />
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
            >
                {/* Informations appareil */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.sectionHeader}
                        onPress={() => toggleExpandSection('device')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.sectionTitleContainer}>
                            <Ionicons name="phone-portrait-outline" size={20} color="#5E72E4" style={styles.sectionIcon} />
                            <Text style={styles.sectionTitle}>Informations Appareil</Text>
                        </View>
                        <Animated.View style={{
                            transform: [{
                                rotate: sectionAnimations.device.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0deg', '180deg']
                                })
                            }]
                        }}>
                            <Ionicons name="chevron-down" size={20} color="#5E72E4" />
                        </Animated.View>
                    </TouchableOpacity>

                    <Animated.View style={[
                        styles.sectionContent,
                        {
                            maxHeight: getSectionMaxHeight('device'), overflow: 'hidden'
                        }]}>
                        <View style={styles.card}>
                            {renderDeviceInfo()}
                        </View>
                    </Animated.View>
                </View>

                {/* Configuration */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.sectionHeader}
                        onPress={() => toggleExpandSection('config')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.sectionTitleContainer}>
                            <Ionicons name="settings-outline" size={20} color="#5E72E4" style={styles.sectionIcon} />
                            <Text style={styles.sectionTitle}>Configuration</Text>
                        </View>
                        <Animated.View style={{
                            transform: [{
                                rotate: sectionAnimations.config.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0deg', '180deg']
                                })
                            }]
                        }}>
                            <Ionicons name="chevron-down" size={20} color="#5E72E4" />
                        </Animated.View>
                    </TouchableOpacity>

                    <Animated.View style={[
                        styles.sectionContent,
                        { maxHeight: getSectionMaxHeight('config'), overflow: 'hidden' }
                    ]}>
                        <View style={styles.card}>

                            <View style={styles.settingRow}>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingTitle}>Variables d'environnement</Text>
                                    <Text style={styles.settingDescription}>Afficher les variables d'environnement</Text>
                                </View>
                                <Switch
                                    value={showEnvironment}
                                    onValueChange={setShowEnvironment}
                                    trackColor={{ false: "#eee", true: "#5E72E480" }}
                                    thumbColor={showEnvironment ? "#5E72E4" : "#f4f3f4"}
                                    ios_backgroundColor="#eee"
                                />
                            </View>

                            {showEnvironment && renderEnvironmentVariables()}

                            <View style={styles.settingRow}>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingTitle}>URL de l'API</Text>
                                    <TextInput
                                        style={styles.apiInput}
                                        value={apiEndpoint}
                                        onChangeText={setApiEndpoint}
                                        placeholder="URL de l'API"
                                        placeholderTextColor="#A0A0A0"
                                        selectionColor="#5E72E4"
                                    />
                                </View>
                            </View>
                        </View>
                    </Animated.View>
                </View>

                {/* Réseau */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.sectionHeader}
                        onPress={() => toggleExpandSection('network')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.sectionTitleContainer}>
                            <Ionicons name="wifi-outline" size={20} color="#5E72E4" style={styles.sectionIcon} />
                            <Text style={styles.sectionTitle}>Réseau</Text>
                        </View>
                        <Animated.View style={{
                            transform: [{
                                rotate: sectionAnimations.network.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0deg', '180deg']
                                })
                            }]
                        }}>
                            <Ionicons name="chevron-down" size={20} color="#5E72E4" />
                        </Animated.View>
                    </TouchableOpacity>

                    <Animated.View style={[
                        styles.sectionContent,
                        { maxHeight: getSectionMaxHeight('network'), overflow: 'hidden' }
                    ]}>
                        <View style={styles.card}>
                            {renderNetworkInfo()}

                            <View style={styles.actionButtonsContainer}>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={testApiConnection}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="globe-outline" size={18} color="#FFFFFF" />
                                    <Text style={styles.actionButtonText}>Tester l'API</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionButton, styles.secondaryButton]}
                                    onPress={checkNetworkStatus}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="refresh-outline" size={18} color="#5E72E4" />
                                    <Text style={[styles.actionButtonText, { color: '#5E72E4' }]}>Rafraîchir</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animated.View>
                </View>

                {/* Actions */}
                <View style={styles.section}>
                    <View style={[styles.sectionTitleContainer, { marginBottom: 15 }]}>
                        <Ionicons name="construct-outline" size={20} color="#5E72E4" style={styles.sectionIcon} />
                        <Text style={styles.sectionTitle}>Actions</Text>
                    </View>
                    <View style={[styles.card,
                    {
                        shadowColor: "#718096",
                        shadowOffset: {
                            width: 0,
                            height: 2,
                        },
                        shadowOpacity: 0.08,
                        shadowRadius: 4,
                        elevation: 3,
                    }
                    ]}>
                        <TouchableOpacity
                            style={[styles.actionRow, { borderTopLeftRadius: 10, borderTopRightRadius: 10 }]}
                            onPress={() => {
                                clearAppCache()
                                toast.info('Cache effacé', {
                                    duration: 2500,
                                    position: toast.positions.TOP
                                });
                            }}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.actionIconContainer, { backgroundColor: '#E3F2FD' }]}>
                                <Ionicons name="cloud-offline-outline" size={20} color="#2196F3" />
                            </View>
                            <Text style={styles.actionText}>Vider le cache</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionRow}
                            onPress={() => {
                                toast.info('Redémarrage de l\'application...', {
                                    duration: 1500,
                                    position: toast.positions.TOP
                                });
                            }}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.actionIconContainer, { backgroundColor: '#E8F5E9' }]}>
                                <Ionicons name="refresh-circle-outline" size={20} color="#4CAF50" />
                            </View>
                            <Text style={styles.actionText}>Redémarrer l'application</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionRow, { borderBottomWidth: 0, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 }]}
                            onPress={clearAppData}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.actionIconContainer, { backgroundColor: '#FFEBEE' }]}>
                                <Ionicons name="trash-outline" size={20} color="#F44336" />
                            </View>
                            <Text style={[styles.actionText, { color: '#F44336' }]}>Effacer toutes les données</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Logs */}
                <TouchableOpacity
                    style={styles.logCard}
                    onPress={() => goToSettingPage('Logs')}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={['#5E72E4', '#825EE4']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.logGradient}
                    >
                        <Ionicons name="document-text-outline" size={24} color="#FFFFFF" />
                        <Text style={styles.logText}>Consulter les logs</Text>
                        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                    </LinearGradient>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7FAFC',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 25,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 6,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backButton: {
        padding: 6,
    },
    refreshButton: {
        padding: 6,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    section: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
    },
    sectionTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionIcon: {
        marginRight: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2D3748',
        letterSpacing: 0.2,
    },
    sectionContent: {
        marginTop: 6,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F4F8',
    },
    settingInfo: {
        flex: 1,
        marginRight: 10,
    },
    settingTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2D3748',
        marginBottom: 4,
    },
    settingDescription: {
        fontSize: 13,
        color: '#718096',
    },
    apiInput: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        padding: 10,
        marginTop: 6,
        fontSize: 14,
        color: '#2D3748',
        backgroundColor: '#F7FAFC',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F4F8',
    },
    infoLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4A5568',
        width: '30%',
    },
    infoValue: {
        fontSize: 14,
        color: '#718096',
        flex: 1,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#5E72E4',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 16,
        flex: 0.48,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#5E72E4',
        shadowOpacity: 0,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
        marginLeft: 8,
    },
    logCard: {
        marginBottom: 20,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: "#5E72E4",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 4,
    },
    logGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 18,
    },
    logText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        flex: 1,
        marginLeft: 12,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F4F8',
    },
    actionIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    actionText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#2D3748',
    },
});

export default DeveloperModePage;
