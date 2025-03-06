import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import UserService from '../services/userService';
import { useToast } from '../hooks/useToast';
import ApiClient from '../services/apiClient';
import { Linking } from 'react-native';
import Constants from 'expo-constants';

const version = Constants.expoConfig?.version || Constants.manifest?.version || 'non disponible';

// Clés pour le stockage sécurisé des données dans SecureStore
const STORAGE_KEYS = {
    USERNAME: 'auth_username',
    PASSWORD: 'auth_password',
    REMEMBER_ME: 'auth_remember_me',
    USER_DATA: 'auth_user_data',
    CALENDAR_URL_KEY: 'secure_calendar_api_url',
    ABSENCES_KEY: 'absences_data',
    GRADES_KEY: 'GRADES_STORAGE_KEY'
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
    const [credentials, setCredientials] = useState({
        username: "",
        password: ""
    })

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
                const biometricAvailable = compatible && enrolled;

                // Mettre à jour l'état ET passer la valeur directement
                setIsBiometricAvailable(biometricAvailable);

                // Ensuite charger les données utilisateur
                await loadStoredUserData(biometricAvailable);
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
    const loadStoredUserData = async (biometricAvailable) => {
        try {
            setLoading(true);

            // Vérifier si l'option "Se souvenir de moi" est activée
            const rememberMe = await SecureStore.getItemAsync(STORAGE_KEYS.REMEMBER_ME);

            if (rememberMe === 'true') {
                const username = await SecureStore.getItemAsync(STORAGE_KEYS.USERNAME);

                if (username) {
                    setStoredUsername(username);

                    // Si la biométrie est disponible, proposer l'authentification biométrique
                    if (biometricAvailable) {
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
            const apiResponse = await userService.login(username, password);
            const result = ApiClient.handleApiResponse(apiResponse);

            if (result.success) {
                setUserData(result.data.userData);
                setUserCookies(result.data.cookies);
                setUserRoutes(result.data.routes);
                setIsAuthenticated(true);

                toast.success({
                    title: result.title,
                    duration: 3000,
                    position: toast.positions.TOP
                });
            } else {
                toast.error({
                    title: result.title,
                    description: result.detail
                });
            }
        } catch (err) {
            console.error('Erreur de connexion avec identifiants stockés', err);
            toast.error({
                title: 'Erreur de connexion avec identifiants stockés',
                description: err.message
            });
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
            const apiResponse = await userService.login(username, password, profileId);
            const result = ApiClient.handleApiResponse(apiResponse);

            if (result.success) {
                setUserData(result.data.userData);
                setUserRoutes(result.data.routes);
                setUserCookies(result.data.cookies);

                // Mise à jour de l'état d'authentification
                setIsAuthenticated(true);
                setNeedsPasswordOnly(false);

                setCredientials({ username, password });

                // Si "Se souvenir de moi" est coché, stocker les identifiants
                if (rememberMe) {
                    await SecureStore.setItemAsync(STORAGE_KEYS.USERNAME, username);
                    await SecureStore.setItemAsync(STORAGE_KEYS.PASSWORD, password);
                    await SecureStore.setItemAsync(STORAGE_KEYS.REMEMBER_ME, 'true');
                }
                toast.success({
                    title: result.title,
                    duration: 3000,
                    position: toast.positions.TOP
                });
            } else {
                toast.error({
                    title: result.title,
                    description: result.detail
                });
            }
        } catch (err) {
            console.error('Erreur de connexion:', err);
            toast.error({
                title: "Une erreur est survenue lors de la connexion",
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
                return toast.error({
                    title: 'Nom d\'utilisateur non trouvé.',
                    description: 'Veuillez vous connecter avec vos identifiants complets.'
                });
            }

            // Connexion avec le nom d'utilisateur stocké et le mot de passe fourni
            await login(storedUsername, password, true);
        } catch (err) {
            console.error('Erreur de connexion avec mot de passe:', err);
            toast.error({
                title: 'Erreur de connexion avec mot de passe',
                description: err.message
            });
        } finally {
            setLoading(false);
        }
    };

    /**
     * Rafraîchit les cookies de l'utilisateur en utilisant les identifiants stockés dans l'état ou dans le SecureStore.
     *
     * La fonction tente d'abord d'utiliser les identifiants disponibles dans l'état actuel.
     * Si ceux-ci échouent ou ne sont pas disponibles, elle essaie d'utiliser ceux stockés dans le SecureStore.
     * En cas d'échec des deux tentatives, l'utilisateur est déconnecté et une notification d'erreur est affichée.
     *
     * @returns {Promise<{ success: boolean, error?: string }>} - Un objet indiquant le succès ou l'échec de l'opération, avec un message d'erreur optionnel.
     */
    const refreshCookies = async () => {
        try {
            // First try with credentials from state
            if (credentials.username && credentials.password) {
                const apiResponse = await userService.login(credentials.username, credentials.password);
                const result = ApiClient.handleApiResponse(apiResponse);

                if (result.success) {
                    setUserCookies(result.data.cookies);
                    return { success: true };
                }
            }

            // If state credentials failed or weren't available, try SecureStore
            const storedUsername = await SecureStore.getItemAsync(STORAGE_KEYS.USERNAME);
            const storedPassword = await SecureStore.getItemAsync(STORAGE_KEYS.PASSWORD);

            if (storedUsername && storedPassword) {
                const apiResponse = await userService.login(storedUsername, storedPassword);
                const result = ApiClient.handleApiResponse(apiResponse);

                if (result.success) {
                    setUserCookies(result.data.cookies);
                    return { success: true };
                }
            }

            // If both attempts failed, log out the user
            await logout();
            toast.error({
                title: "Session expirée",
                description: "Veuillez vous reconnecter",
                duration: 3000,
                position: toast.positions.TOP
            });
            return { success: false, error: "Session expired" };

        } catch (err) {
            console.error('Erreur lors du rafraîchissement des cookies:', err);
            toast.error({
                title: 'Erreur lors du rafraîchissement des cookies',
                description: err.message
            });
            await logout();
            return { success: false, error: err.message };
        }
    }

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
            await AsyncStorage.removeItem(STORAGE_KEYS.GRADES_KEY);

            toast.success({
                title: 'Déconnexion Réussi',
                duration: 3000,
                position: toast.positions.TOP
            })
        } catch (err) {
            console.error('Erreur de déconnexion:', err);
            toast.error({
                title: 'Erreur de déconnexion:',
                description: err.message
            });
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
            const calendar = await userService.getCalendar(path, userCookies);
            const result = ApiClient.handleApiResponse(calendar);

            if (result.success) {
                return { success: true, data: result.data }
            } else {
                return { success: false, error: result }
            }
        } catch (err) {
            return {
                success: false,
                error: {
                    title: err.message,
                    detail: ''
                }
            };
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
                    const apiResponse = await userService.getCalendarKey(calendrier.route, userCookies);
                    const result = ApiClient.handleApiResponse(apiResponse);

                    if (result.success) {
                        return { success: true, data: { key: result.data }};
                    } else {
                        return { success: false, error: result };
                    }
                }
            }
        } catch (err) {
            setError(err.message);
            return {
                success: false,
                error: {
                    title: err.message,
                    detail: ''
                }
            };
        }
    };

    /**
     * Récupère les données des absences de l'utilisateur
     */
    const getAbsences = async () => {
        try {
            setError(null);
            const absences = userRoutes.find(route => route.title === "Mes absences");
            const apiResponse = await userService.getAbsences(absences.route, userCookies);
            const result = ApiClient.handleApiResponse(apiResponse);


            if (result.success) {
                return { success: true, data: result.data };
            } else {
                return { success: false, error: result };
            }
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    };

    /**
     * Récupère les notes de l'utilisateur
     */
    const getGrades = async () => {
        try {
            setError(null);
            const myGrades = userRoutes.find(route => route.title === "Mes notes");

            if (myGrades && myGrades.items) {
                // Rechercher le sous-élément "Mon calendrier"
                const grades = myGrades.items.find(item => item.title === "Mes évaluations");

                if (grades) {
                    const apiResponse = await userService.getGrades(grades.route, userCookies);
                    const result = ApiClient.handleApiResponse(apiResponse);

                    if (result.success) {
                        return { success: true, data: result.data };
                    } else {
                        return { success: false, error: result };
                    }
                }
            }
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    };

    const getUpdate = async () => {
        try {
            setError(null);
            const result = await userService.getUpdate();
            if (result.errors.length > 0) return

            const data = result.data[`last_release_${version.split(' ')[1].toLowerCase()}`]

            if (data.version === version) return
            toast.withAction(
                'Nouvelle version disponible',
                `La version ${data.version} est disponible, de nouvelle amélioration on été rajouté`,
                () => Linking.openURL('https://studx.ddns.net/'),
                {
                    actionText: 'Allez voir 👀'
                }, {
                    isPersistent: true
                }
            )
        } catch (error) {

        }
    }

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
        getAbsences,
        getGrades,
        getUpdate
    };

    return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
};

export default UserContext;
