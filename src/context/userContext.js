import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import UserService from '../services/userService';
import { useToast } from '../hooks/useToast';

// Clés pour le stockage sécurisé des données dans SecureStore
const STORAGE_KEYS = {
    USERNAME: 'auth_username',
    PASSWORD: 'auth_password',
    REMEMBER_ME: 'auth_remember_me',
    USER_DATA: 'auth_user_data',
    CALENDAR_URL_KEY: 'secure_calendar_api_url',
    ABSENCES_KEY: 'absences_data'
};

// Création du contexte
const UserContext = createContext();

// Hook personnalisé pour utiliser le contexte
export const useUser = () => useContext(UserContext);

/**
 * Provider du contexte utilisateur
 * Gère l'authentification, les informations utilisateur et les interactions avec SecureStore
 */
export const UserProvider = ({ children }) => {
    // Initialisation du service utilisateur
    const userService = new UserService();
    const toast = useToast();

    // États de gestion utilisateur
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userData, setUserData] = useState(null);
    const [userRoutes, setUserRoutes] = useState(null);
    const [userCookies, setUserCookies] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [needsPasswordOnly, setNeedsPasswordOnly] = useState(false);

    // État de la biométrie
    const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
    const [storedUsername, setStoredUsername] = useState(null);

    // Vérifier la disponibilité de la biométrie au chargement
    useEffect(() => {
        const initializeApp = async () => {
            try {
                // Vérifier d'abord la biométrie
                const compatible = await LocalAuthentication.hasHardwareAsync();
                const enrolled = await LocalAuthentication.isEnrolledAsync();
                setIsBiometricAvailable(compatible && enrolled);

                // Ensuite charger les données utilisateur
                await loadStoredUserData();
            } catch (err) {
                console.error('Erreur lors de l\'initialisation:', err);
            }
        };

        initializeApp();
    }, []);

    /**
     * Charge les données utilisateur stockées au démarrage de l'application
     * Propose l'authentification biométrique si disponible
     */
    const loadStoredUserData = async () => {
        try {
            setLoading(true);

            // Vérifier si l'option "Se souvenir de moi" est activée
            const rememberMe = await SecureStore.getItemAsync(STORAGE_KEYS.REMEMBER_ME);

            if (rememberMe === 'true') {
                const username = await SecureStore.getItemAsync(STORAGE_KEYS.USERNAME);

                if (username) {
                    setStoredUsername(username);

                    // Si la biométrie est disponible, proposer l'authentification biométrique
                    if (isBiometricAvailable) {
                        const biometricAuth = await authenticateWithBiometrics();

                        if (biometricAuth.success) {
                            // Authentification biométrique réussie, récupérer le mot de passe et connecter
                            const password = await SecureStore.getItemAsync(STORAGE_KEYS.PASSWORD);
                            if (password) {
                                await loginWithStoredCredentials(username, password);
                            }
                        } else {
                            // Authentification biométrique échouée, demander le mot de passe
                            setNeedsPasswordOnly(true);
                        }
                    } else {
                        // Biométrie non disponible, demander le mot de passe
                        setNeedsPasswordOnly(true);
                    }
                }
            }
        } catch (err) {
            console.error('Erreur lors du chargement des données:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Authentification avec la biométrie (empreinte digitale ou Face ID)
     */
    const authenticateWithBiometrics = async () => {
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Authentifiez-vous pour accéder à votre compte',
                cancelLabel: 'Annuler',
                disableDeviceFallback: false,
            });

            return { success: result.success };
        } catch (err) {
            console.error('Erreur d\'authentification biométrique:', err);
            return { success: false, error: err.message };
        }
    };

    /**
     * Connexion avec les identifiants stockés après authentification biométrique
     */
    const loginWithStoredCredentials = async (username, password) => {
        try {
            setError(null);
            const { userData: user, routes, cookies } = await userService.login(username, password);
            setUserData(user);
            setUserCookies(cookies);
            setUserRoutes(routes);
            setIsAuthenticated(true);
            return { success: true };
        } catch (err) {
            console.error('Erreur de connexion avec identifiants stockés:', err);
            setError(err.message);
            return { success: false, error: err.message };
        }
    };

    /**
     * Connexion avec identifiant et mot de passe
     * @param {string} username - Nom d'utilisateur
     * @param {string} password - Mot de passe
     * @param {boolean} rememberMe - Option pour mémoriser les identifiants
     * @param {string|number} profileId - Identifiant du profil (optionnel)
     */
    const login = async (username, password, rememberMe = false, profileId = "") => {
        try {
            setError(null);
            setLoading(true);

            // Appel au service d'authentification
            const { userData: user, routes, cookies } = await userService.login(username, password, profileId);

            // Mise à jour de l'état d'authentification
            setUserData(user);
            setUserRoutes(routes);
            setUserCookies(cookies);
            setIsAuthenticated(true);
            setNeedsPasswordOnly(false);

            // Si "Se souvenir de moi" est coché, stocker les identifiants
            if (rememberMe) {
                await SecureStore.setItemAsync(STORAGE_KEYS.USERNAME, username);
                await SecureStore.setItemAsync(STORAGE_KEYS.PASSWORD, password);
                await SecureStore.setItemAsync(STORAGE_KEYS.REMEMBER_ME, 'true');
            }
            toast.success('Connexion réussie !', {
                duration: 3000,
                position: toast.positions.TOP
            });

        } catch (err) {
            console.error('Erreur de connexion:', err);
            toast.error(`Une erreur est survenue lors de la connexion`, {
                duration: 3000,
                position: toast.positions.TOP
            });
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Connexion avec le mot de passe uniquement
     * Utilisé lorsque la biométrie échoue ou n'est pas disponible
     */
    const loginWithPasswordOnly = async (password) => {
        try {
            setError(null);
            setLoading(true);

            if (!storedUsername) {
                throw new Error('Nom d\'utilisateur non trouvé. Veuillez vous connecter avec vos identifiants complets.');
            }

            // Connexion avec le nom d'utilisateur stocké et le mot de passe fourni
            const result = await login(storedUsername, password, true);
            return result;
        } catch (err) {
            console.error('Erreur de connexion avec mot de passe:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    /**
   * Déconnexion de l'utilisateur
   * Supprime toutes les données stockées dans SecureStore
   */
    const logout = async () => {
        try {
            setLoading(true);

            // Réinitialisation des états
            setIsAuthenticated(false);
            setUserData(null);
            setNeedsPasswordOnly(false);
            setStoredUsername(null);

            // Suppression des données stockées
            await SecureStore.deleteItemAsync(STORAGE_KEYS.USERNAME);
            await SecureStore.deleteItemAsync(STORAGE_KEYS.PASSWORD);
            await SecureStore.deleteItemAsync(STORAGE_KEYS.REMEMBER_ME);
            await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);

            // Effacer aussi l'URL du calendrier si le contexte est disponible
            await SecureStore.deleteItemAsync(STORAGE_KEYS.CALENDAR_URL_KEY);
            await AsyncStorage.removeItem(STORAGE_KEYS.ABSENCES_KEY);

            return { success: true };
        } catch (err) {
            console.error('Erreur de déconnexion:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Récupère les données du calendrier de l'utilisateur
     */
    const getCalendar = async (path) => {
        try {
            setError(null);
            const calendar = await userService.getCalendar(path);

            return { success: true, data: calendar };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    };

    /**
     * Récupère les clés du calendrier de l'utilisateur
     */
    const getCalendarKey = async () => {
        try {
            setError(null);
            const emploiDuTemps = userRoutes.find(route => route.title === "Mon emploi du temps");

            if (emploiDuTemps && emploiDuTemps.items) {
                // Rechercher le sous-élément "Mon calendrier"
                const calendrier = emploiDuTemps.items.find(item => item.title === "Mon calendrier");

                if (calendrier) {
                    const key = await userService.getCalendarKey(calendrier.route, userCookies);
                    return { success: true, data: { key } };
                }
            }
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    };

    /**
     * Récupère les données des absences de l'utilisateur
     */
    const getAbsences = async () => {
        try {
            setError(null);
            const absences = userRoutes.find(route => route.title === "Mes absences");
            const result = await userService.getAbsences(absences.route, userCookies);

            return { success: true, data: result };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    };

    // Valeurs exposées par le contexte
    const contextValue = {
        // États
        isAuthenticated,
        userData,
        loading,
        error,
        needsPasswordOnly,
        isBiometricAvailable,
        storedUsername,

        // Méthodes
        login,
        loginWithPasswordOnly,
        logout,
        authenticateWithBiometrics,
        getCalendar,
        getCalendarKey,
        getAbsences
    };

    return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
};

export default UserContext;
