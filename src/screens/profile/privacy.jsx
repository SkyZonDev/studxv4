import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, SafeAreaView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useToast } from '../../hooks/useToast';
import { useUser } from '../../context/userContext';
import CustomAlert from '../../components/alert/CustomAlert';
import { useTheme } from '../../context/themeContext';

const PrivacyPage = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const toast = useToast();
    const { colors } = useTheme();
    const { removeAllData } = useUser();

    // États pour les options de confidentialité
    const [profileVisibility, setProfileVisibility] = useState(true);
    const [activityStatus, setActivityStatus] = useState(true);
    const [locationSharing, setLocationSharing] = useState(false);
    const [dataCollection, setDataCollection] = useState(true);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false)

    const handleNotImplemented = () => {
        toast.info('Accès impossible', 'Fonctionnalité en cours de développement', {
            duration: 2500,
            position: toast.positions.TOP
        });
    };

    const handleDeleteAllData = async () => {
        setShowDeleteAlert(true);
    }

    const renderSettingItem = (icon, title, description, value, onPress, last = false, rightComponent = null) => (
        <TouchableOpacity
            style={[styles.settingItem, !last ? { borderBottomWidth: 1, borderBottomColor: colors.border } : null]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.settingContent}>
                <View style={styles.settingLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.info.border }]}>
                        <Ionicons name={icon} size={20} color={colors.primary.main} />
                    </View>
                    <View style={styles.settingTexts}>
                        <Text style={styles.settingTitle}>{title}</Text>
                        {description && <Text style={styles.settingDescription}>{description}</Text>}
                    </View>
                </View>
                <View style={styles.settingRight}>
                    {rightComponent || (
                        <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

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
        backButton: {
            padding: 5,
        },
        headerTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: colors.primary.contrast,
        },
        content: {
            flex: 1,
            paddingHorizontal: 20,
        },
        section: {
            marginTop: 24,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: colors.text.primary,
            marginBottom: 12,
        },
        card: {
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 5,
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
        },
        settingItem: {
            padding: 16,
        },
        settingContent: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        settingLeft: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
        },
        settingTexts: {
            flex: 1,
        },
        iconContainer: {
            width: 34,
            height: 34,
            borderRadius: 8,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
        },
        settingTitle: {
            fontSize: 14,
            color: colors.text.primary,
            fontWeight: '500',
        },
        settingDescription: {
            fontSize: 12,
            color: colors.text.tertiary,
            marginTop: 2,
        },
        settingRight: {
            flexDirection: 'row',
            alignItems: 'center',
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
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.primary.contrast} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Confidentialité</Text>
                    <View style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="transparent" />
                    </View>
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Profile Privacy */}
                {/* <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Profil</Text>
                    <View style={styles.card}>
                        {renderSettingItem(
                            'eye',
                            'Visibilité du profil',
                            'Choisir qui peut voir votre profil',
                            '',
                            () => setProfileVisibility(!profileVisibility),
                            false,
                            <Switch
                                value={profileVisibility}
                                onValueChange={setProfileVisibility}
                                trackColor={{ false: '#E0E0E0', true: '#4A6FE180' }}
                                thumbColor={profileVisibility ? '#4A6FE1' : '#F5F5F5'}
                            />
                        )}
                        {renderSettingItem(
                            'radio',
                            'Statut d\'activité',
                            'Montrer quand vous êtes en ligne',
                            '',
                            () => setActivityStatus(!activityStatus),
                            false,
                            <Switch
                                value={activityStatus}
                                onValueChange={setActivityStatus}
                                trackColor={{ false: '#E0E0E0', true: '#4A6FE180' }}
                                thumbColor={activityStatus ? '#4A6FE1' : '#F5F5F5'}
                            />
                        )}
                        {renderSettingItem(
                            'location',
                            'Partage de localisation',
                            'Autoriser l\'application à accéder à votre position',
                            '',
                            () => setLocationSharing(!locationSharing),
                            true,
                            <Switch
                                value={locationSharing}
                                onValueChange={setLocationSharing}
                                trackColor={{ false: '#E0E0E0', true: '#4A6FE180' }}
                                thumbColor={locationSharing ? '#4A6FE1' : '#F5F5F5'}
                            />
                        )}
                    </View>
                </View> */}

                {/* Data Privacy */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Données</Text>
                    <View style={styles.card}>
                        {/* {renderSettingItem(
                            'analytics',
                            'Collecte de données',
                            'Autoriser la collecte de données pour améliorer l\'application',
                            '',
                            () => setDataCollection(!dataCollection),
                            false,
                            <Switch
                                value={dataCollection}
                                onValueChange={setDataCollection}
                                trackColor={{ false: '#E0E0E0', true: '#4A6FE180' }}
                                thumbColor={dataCollection ? '#4A6FE1' : '#F5F5F5'}
                            />
                        )}
                        {renderSettingItem(
                            'download',
                            'Télécharger mes données',
                            'Obtenir une copie de toutes vos données',
                            '',
                            handleNotImplemented
                        )} */}
                        {renderSettingItem(
                            'trash',
                            'Supprimer mes données',
                            'Effacer définitivement toutes vos données',
                            '',
                            handleDeleteAllData,
                            true
                        )}
                    </View>
                </View>

                {/* Legal */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informations légales</Text>
                    <View style={styles.card}>
                        {renderSettingItem(
                            'document-text',
                            'Politique de confidentialité',
                            'Consultez notre politique de confidentialité',
                            '',
                            handleNotImplemented
                        )}
                        {renderSettingItem(
                            'document',
                            'Conditions d\'utilisation',
                            'Consultez nos conditions d\'utilisation',
                            '',
                            handleNotImplemented,
                            true
                        )}
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            <CustomAlert
                visible={showDeleteAlert}
                onClose={() => setShowDeleteAlert(false)}
                type="warning"
                title="Confirmer la suppression"
                message="Êtes-vous sûr de vouloir supprimer toutes vos données ? Cette action vous déconnectera"
                buttons={
                    [
                        { text: 'Annuler', style: 'cancel' },
                        {
                            text: 'Supprimer',
                            style: 'confirm',
                            onPress: async () => {
                                await removeAllData();

                            }
                        }
                    ]
                }
                dismissable
            />
        </SafeAreaView>
    );
};

export default PrivacyPage;
