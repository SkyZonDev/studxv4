import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, SafeAreaView, StatusBar, Switch, Linking, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../hooks/useUser';
import { usePreferences } from '../hooks/usePreferences';
import { useTheme } from '../context/themeContext';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import { User } from 'lucide-react-native';
import { SPACING } from '../styles/theme';
import { useToast } from '../hooks/useToast';
import GradientIcon from '../components/gradientIcon';

const ProfileScreen = () => {
    const navigation = useNavigation();
    const { userData, logout } = useUser();
    const { preferences } = usePreferences();
    const toast = useToast();
    const { colors, isDarkMode, darkMode, toggleTheme } = useTheme();
    const insets = useSafeAreaInsets();
    const version = Constants.expoConfig?.version || 'non disponible';

    const [devMode, setDevMode] = useState(false);
    const [compteurClics, setCompteurClics] = useState(0);
    const timerRef = useRef(null);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            toast.error(`Erreur lors de la déconnexion`, {
                duration: 3000,
                position: toast.positions.TOP
            })
        }
    };

    const renderSettingItem = (icon, title, value, onPress, last = false, rightComponent = null) => (
        <TouchableOpacity style={[styles.settingItem, !last ? { borderBottomWidth: 1, borderBottomColor: colors.border } : null]} onPress={onPress}>
            <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#4A6FE120' }]}>
                    <Ionicons name={icon} size={20} color="#4A6FE1" />
                </View>
                <Text style={styles.settingTitle}>{title}</Text>
            </View>
            <View style={styles.settingRight}>
                {rightComponent || (
                    <>
                        <Text style={styles.settingValue}>{value}</Text>
                        <Ionicons name="chevron-forward" size={20} color="#A0A0A0" />
                    </>
                )}
            </View>
        </TouchableOpacity>
    );

    const renderInfoItem = (label, value, last = false) => (
        <View style={[styles.infoItem, !last ? { borderBottomWidth: 1, borderBottomColor: colors.border } : null]}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{userData[value]}</Text>
        </View>
    );

    const goToSettingPage = (path) => {
        navigation.navigate(path);
    };

    const openLink = (url) => {
        Linking.openURL(url);
    };

    const activeDevMode = () => {
        toast.success('Mode développeur activé');
        setDevMode(true)
    };

    const clicAvatar = () => {
        // Efface le timer précédent s'il existe
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        // Incrémente le compteur
        const nouveauCompteur = compteurClics + 1;
        setCompteurClics(nouveauCompteur);

        // Si 10 clics atteints, exécute la fonction et réinitialise
        if (nouveauCompteur >= 10) {
            activeDevMode();
            setCompteurClics(0);
            return;
        }

        // Définit un timer pour réinitialiser après 3 secondes d'inactivité
        timerRef.current = setTimeout(() => {
            setCompteurClics(0);
        }, 3000);
    };

    const handleNotImplemented = () => {
        toast.info('Accès impossible', 'Fonctionnalité en cours de développement', {
            duration: 2500,
            position: toast.positions.TOP
        });
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
        profileHeader: {
            alignItems: 'center',
            marginTop: 20,
        },
        avatarContainer: {
            marginBottom: 12,
        },
        avatar: {
            width: 100,
            height: 100,
            borderRadius: 50,
            borderWidth: 3,
            borderColor: colors.primary.constrast,
        },
        avatarPlaceholder: {
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: colors.primary.main,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 3,
            borderColor: colors.primary.contrast,
        },
        avatarText: {
            fontSize: 28,
            fontWeight: 'bold',
            color: colors.primary.contrast,
        },
        cameraIconContainer: {
            position: 'absolute',
            bottom: 0,
            right: 0,
            backgroundColor: colors.primary.main,
            width: 28,
            height: 28,
            borderRadius: 14,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: colors.primary.contrast,
        },
        userName: {
            fontSize: 22,
            fontWeight: 'bold',
            color: colors.text.primary,
            marginBottom: 4,
        },
        userPromotion: {
            fontSize: 14,
            color: colors.text.tertiary,
            marginBottom: 8,
        },
        userIdContainer: {
            backgroundColor: '#E6EFFF',
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 12,
        },
        userId: {
            color: colors.primary.main,
            fontWeight: '600',
            fontSize: 12,
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
        },
        infoItem: {
            padding: 12,
        },
        infoLabel: {
            fontSize: 12,
            color: colors.text.tertiary,
            marginBottom: 4,
        },
        infoValue: {
            fontSize: 16,
            color: colors.text.primary,
            fontWeight: '500',
        },
        infoInput: {
            fontSize: 16,
            color: colors.text.primary,
            padding: 0,
            borderBottomWidth: 1,
            borderBottomColor: colors.primary.main,
        },
        settingItem: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 12,
        },
        settingLeft: {
            flexDirection: 'row',
            alignItems: 'center',
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
        settingRight: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        settingValue: {
            fontSize: 14,
            color: colors.text.tertiary,
            marginRight: 6,
        },
        logoutButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 15,
            elevation: 2,
        },
        logoutText: {
            fontSize: 16,
            fontWeight: '600',
            color: '#FF5252',
            marginLeft: 8,
        },
        logButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 15,
            elevation: 2,
        },
        logText: {
            fontSize: 16,
            fontWeight: '600',
            marginLeft: 8,
            color: colors.text.primary
        },
        credits: {
            marginTop: 30,
            alignItems: 'center',
            paddingBottom: 20,
        },
        creditsText: {
            fontSize: 16,
            fontWeight: 'bold',
            color: colors.text.primary,
            marginBottom: 5,
        },
        creditsSubtext: {
            fontSize: 12,
            color: colors.text.tertiary,
            lineHeight: 18,
        },
        developerCard: {
            alignItems: 'center',
            padding: 20,
        },
        avatarDev: {
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: colors.primary.main,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 4,
        },
        developerName: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.text.primary,
            marginTop: 8,
        },
        developerTitle: {
            fontSize: 14,
            color: colors.text.secondary,
            marginTop: 4,
        },
        socialLinks: {
            flexDirection: 'row',
            marginTop: SPACING.md,
            gap: SPACING.md,
        },
        socialButton: {
            padding: SPACING.sm,
            borderRadius: SPACING.sm,
            backgroundColor: colors.info.border,
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
                    <Text style={styles.headerTitle}>Profil</Text>

                    <View style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="transparent" />
                    </View>
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <TouchableOpacity style={styles.avatarContainer}>
                        {userData.avatar ? (
                            <Image
                                source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
                                style={styles.avatar}
                            />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>{userData.firstname[0]}{userData.lastname[0]}</Text>
                                <View style={styles.cameraIconContainer}>
                                    <Ionicons name="camera" size={14} color="#FFFFFF" />
                                </View>
                            </View>
                        )}
                    </TouchableOpacity>
                    <Text style={styles.userName}>{userData.firstname} {userData.lastname}</Text>
                    <Text style={styles.userPromotion}>{userData.promotion}</Text>
                    <View style={styles.userIdContainer}>
                        {/* <Text style={styles.userId}>{userData.studentId}</Text> */}
                    </View>
                </View>

                {/* Personal Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informations personnelles</Text>
                    <View style={styles.card}>
                        {renderInfoItem('Prénom', 'firstname')}
                        {renderInfoItem('Nom', 'lastname')}
                        {renderInfoItem('Email', 'email', true)}
                        {/* {renderInfoItem('Promotion', 'promotion', false)} */}
                    </View>
                </View>

                {/* Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Paramètres</Text>
                    <View style={styles.card}>
                        {renderSettingItem(
                            'notifications',
                            'Notifications',
                            preferences.notifications ? 'Activées' : 'Désactivées',
                            handleNotImplemented, // À implémenter plus tard
                            false,
                            <Switch
                                value={userData.notificationsEnabled}
                                onValueChange={handleNotImplemented}
                                trackColor={{ false: colors.card.border, true: '#4A6FE180' }}
                                thumbColor={userData.notificationsEnabled ? '#4A6FE1' : '#F5F5F5'}
                            />
                        )}
                        {renderSettingItem(
                            'moon',
                            'Apparence',
                            preferences.appearance,
                            toggleTheme,
                            false,
                            <Switch
                                value={isDarkMode}
                                onValueChange={toggleTheme} // toggleTheme
                                trackColor={{ false: colors.card.border, true: '#4A6FE180' }}
                                thumbColor={isDarkMode ? '#4A6FE1' : colors.primary.background}
                            />
                        )}
                        {renderSettingItem('language', 'Langue', preferences.language, handleNotImplemented)}
                        {renderSettingItem('lock-closed', 'Confidentialité', '', () => goToSettingPage('Privacy'), true)}
                    </View>
                </View>

                {/* Support */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Support</Text>
                    <View style={styles.card}>
                        {/* {renderSettingItem('help-circle', 'Aide et assistance', '', () => goToSettingPage('Help'))} */}
                        {renderSettingItem('mail', 'Contacter le support', '', () => goToSettingPage('Support'), true)}
                    </View>
                </View>

                {/* Credit Dev */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>À propos</Text>
                    <View style={styles.card}>
                        <View style={styles.developerCard}>
                            <Pressable style={styles.avatarDev} onPress={clicAvatar}>
                                <User size={40} color="white" />
                            </Pressable>
                            <Text style={styles.developerName}>Jean-Pierre Dupuis</Text>
                            <Text style={styles.developerTitle}>Concepteur & Développeur Full-Stack</Text>
                            <View style={styles.socialLinks}>
                                <TouchableOpacity
                                    style={styles.socialButton}
                                    onPress={() => openLink('mailto:jeanpierredupuis38@gmail.com')}
                                >
                                    <Ionicons name='mail-outline' size={20} color={colors.text.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.socialButton}
                                    onPress={() => openLink('https://github.com/SkyZonDev')}
                                >
                                    <Ionicons name='logo-github' size={22} color={colors.text.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.socialButton}
                                    onPress={() => openLink('https://instagram.com/jp_dps0')}
                                >
                                    <GradientIcon
                                        name="logo-instagram"
                                        size={22}
                                        gradient={['#F58529', '#FEDA77', '#DD2A7B', '#8134AF', '#515BD4']}
                                        style={{ width: 40, height: 40 }}
                                    />

                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Logs */}
                {devMode && (
                    <View style={[styles.section, { flexDirection: "row", gap: 10, marginTop: 15 }]}>
                        <TouchableOpacity style={[styles.logButton, { flex: 1 }]} onPress={() => goToSettingPage('DevMode')}>
                            <Ionicons name="code" size={20} color="#4A6FE1" />
                            <Text style={styles.logText}>Mode développeur</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.logButton} onPress={() => setDevMode(false)}>
                            <Ionicons name="close" size={20} color="#FF3B30" />
                        </TouchableOpacity>
                    </View>
                )}


                {/* Logout */}
                <View style={styles.section}>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Ionicons name="log-out" size={20} color="#FF5252" />
                        <Text style={styles.logoutText}>Déconnexion</Text>
                    </TouchableOpacity>
                </View>

                {/* Credits */}
                <View style={styles.credits}>
                    <Text style={styles.creditsText}>StudX v{version}</Text>
                    <Text style={styles.creditsSubtext}>Développé par Jean-Pierre DUPUIS</Text>
                    <Text style={styles.creditsSubtext}>© {new Date().getFullYear()} Tous droits réservés</Text>
                </View>

                <View style={{ height: 70 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

export default ProfileScreen;
