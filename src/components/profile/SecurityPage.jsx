import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, SafeAreaView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useToast } from '../hooks/useToast';

const SecurityPage = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const toast = useToast();

    // États pour les options de sécurité
    const [twoFactorAuth, setTwoFactorAuth] = useState(false);
    const [biometricAuth, setBiometricAuth] = useState(false);
    const [passwordNotifications, setPasswordNotifications] = useState(true);

    const handleNotImplemented = () => {
        toast.info('Fonctionnalité en cours de développement', {
            duration: 2500,
            position: toast.positions.TOP
        });
    };

    const renderSettingItem = (icon, title, description, value, onPress, last = false, rightComponent = null) => (
        <TouchableOpacity
            style={[styles.settingItem, !last ? { borderBottomWidth: 1, borderBottomColor: '#F0F0F0' } : null]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.settingContent}>
                <View style={styles.settingLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: '#4A6FE120' }]}>
                        <Ionicons name={icon} size={20} color="#4A6FE1" />
                    </View>
                    <View style={styles.settingTexts}>
                        <Text style={styles.settingTitle}>{title}</Text>
                        {description && <Text style={styles.settingDescription}>{description}</Text>}
                    </View>
                </View>
                <View style={styles.settingRight}>
                    {rightComponent || (
                        <Ionicons name="chevron-forward" size={20} color="#A0A0A0" />
                    )}
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
                    <TouchableOpacity onPress={() => navigation.navigate('profile')} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Sécurité</Text>
                    <View style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="transparent" />
                    </View>
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Authentication */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Authentification</Text>
                    <View style={styles.card}>
                        {renderSettingItem(
                            'key',
                            'Mot de passe',
                            'Modifier votre mot de passe',
                            '',
                            handleNotImplemented
                        )}
                        {renderSettingItem(
                            'shield-checkmark',
                            'Authentification à deux facteurs',
                            'Sécurisez votre compte avec une vérification supplémentaire',
                            '',
                            () => setTwoFactorAuth(!twoFactorAuth),
                            false,
                            <Switch
                                value={twoFactorAuth}
                                onValueChange={setTwoFactorAuth}
                                trackColor={{ false: '#E0E0E0', true: '#4A6FE180' }}
                                thumbColor={twoFactorAuth ? '#4A6FE1' : '#F5F5F5'}
                            />
                        )}
                        {renderSettingItem(
                            'finger-print',
                            'Authentification biométrique',
                            'Connectez-vous avec votre empreinte digitale ou Face ID',
                            '',
                            () => setBiometricAuth(!biometricAuth),
                            true,
                            <Switch
                                value={biometricAuth}
                                onValueChange={setBiometricAuth}
                                trackColor={{ false: '#E0E0E0', true: '#4A6FE180' }}
                                thumbColor={biometricAuth ? '#4A6FE1' : '#F5F5F5'}
                            />
                        )}
                    </View>
                </View>

                {/* Security Monitoring */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Surveillance</Text>
                    <View style={styles.card}>
                        {renderSettingItem(
                            'time',
                            'Historique des connexions',
                            'Consultez les dernières connexions à votre compte',
                            '',
                            handleNotImplemented
                        )}
                        {renderSettingItem(
                            'alert-circle',
                            'Appareils connectés',
                            'Gérez les appareils connectés à votre compte',
                            '',
                            handleNotImplemented,
                            true
                        )}
                    </View>
                </View>

                {/* Security Preferences */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Préférences</Text>
                    <View style={styles.card}>
                        {renderSettingItem(
                            'notifications',
                            'Alertes de sécurité',
                            'Recevez des notifications pour les activités suspectes',
                            '',
                            () => setPasswordNotifications(!passwordNotifications),
                            false,
                            <Switch
                                value={passwordNotifications}
                                onValueChange={setPasswordNotifications}
                                trackColor={{ false: '#E0E0E0', true: '#4A6FE180' }}
                                thumbColor={passwordNotifications ? '#4A6FE1' : '#F5F5F5'}
                            />
                        )}
                        {renderSettingItem(
                            'lock-closed',
                            'Verrouillage automatique',
                            'Délai avant verrouillage automatique de l\'application',
                            '',
                            handleNotImplemented,
                            true
                        )}
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
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
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
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
        color: '#333',
        marginBottom: 12,
    },
    card: {
        backgroundColor: '#FFFFFF',
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
        color: '#333333',
        fontWeight: '500',
    },
    settingDescription: {
        fontSize: 12,
        color: '#757575',
        marginTop: 2,
    },
    settingRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});

export default SecurityPage;
