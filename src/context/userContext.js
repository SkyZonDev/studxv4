import React, { createContext, useState, useContext, useEffect } from 'react';
import logger from '../services/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as FileSystem from 'expo-file-system';
import UserService from '../services/userService';
import { useToast } from '../hooks/useToast';
import ApiClient from '../services/apiClient';
import { Linking } from 'react-native';
import Constants from 'expo-constants';

const version = Constants.expoConfig?.version || Constants.manifest?.version || 'non disponible';

// Clés pour le stockage sécurisé des données dans SecureStore
const STORAGE_KEYS = {
    ID: 'unique_id',
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
 * @description Provider du contexte utilisateur
 * @info Gère l'authentification, les informations utilisateur et les interactions avec SecureStore
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
    const [needReload, setNeedReload] = useState(false);
    const [credentials, setCredientials] = useState({
        username: "",
        password: ""
    })

    // État de la biométrie
    const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
    const [storedUsername, setStoredUsername] = useState(null);

    const generateUniqueID = async () => {
        try {
            setError(null);

            const storedID = await SecureStore.getItemAsync(STORAGE_KEYS.ID);
            if (storedID) return;

            const { data } = await userService.getUniqueID();

            if (Object.keys(data).length) {
                try {
                    await SecureStore.setItemAsync(STORAGE_KEYS.ID, data.id);
                    logger.info('UserContext.jsx', 'generateUniqueID', 'Identifiant unique généré');
                    return toast.success(
                        'Identifiant unique générer',
                        'Cet ID permettra de facilité l\'aide pour la détection des problèmes'
                    )
                } catch (error) {

                    return toast.success(
                        'Impossible d\'enregistrer l\'identifiant unique',
                        'Une erreur est survenue lors de l\'enregistrement de votre unique ID'
                    )
                }
            }

            toast.error(
                'Impossible de récupérer l\'identifiant unique',
                'Cet ID permettra de facilité l\'aide pour la détection des problèmes',
                {
                    duration: 5000
                }
            );
        } catch (error) {
            toast.error('Une erreur est survenue', 'Impossible de récupérer l\'identifiant unique');
        }
    }

    const getUniqueID = async () => {
        try {
            const storedID = await SecureStore.getItemAsync(STORAGE_KEYS.ID);
            return storedID ? storedID : 'ID non initialisé';
        } catch (error) {
            logger.error('Impossible de récupérer l\'ID unique', error)
            toast.error('Une erreur est survenue', 'Impossible de récupérer l\'unique ID');
        }
    }

    // Vérifier la disponibilité de la biométrie au chargement
    useEffect(() => {
        const initializeApp = async () => {
            try {
                await generateUniqueID();
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
     * @description Charge les données utilisateur stockées au démarrage de l'application
     * @info Propose l'authentification biométrique si disponible
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
            logger.error('UserContext.jsx', 'loadStoredUserData', 'Erreur lors du chargement des données', err);
            console.error('Erreur lors du chargement des données:', err);
        } finally {
            setLoading(false);
        }
    };

    /**
     * @description Authentification avec la biométrie (empreinte digitale ou Face ID)
     */
    const authenticateWithBiometrics = async () => {
        try {
            logger.debug('userContext.js', 'authenticateWithBiometrics', 'Tentative d\'authentification biométrique');

            if (needReload) {
                logger.info('userContext.js', 'authenticateWithBiometrics', 'Redémarrage requis, authentification impossible');
                return toast.info('Redémarrage demandé', 'Veuillez fermer et redémarrer l\'application');
            }

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Authentifiez-vous pour accéder à votre compte',
                cancelLabel: 'Annuler',
                disableDeviceFallback: true,
            });

            logger.info('userContext.js', 'authenticateWithBiometrics', 'Résultat de l\'authentification biométrique', { success: result.success });
            return { success: result.success };
        } catch (err) {
            logger.error('userContext.js', 'authenticateWithBiometrics', 'Erreur d\'authentification biométrique', err);
            console.error('Erreur d\'authentification biométrique:', err);
            return { success: false, error: err.message };
        }
    };

    /**
     * @description Connexion avec les identifiants stockés après authentification biométrique
     */
    const loginWithStoredCredentials = async (username, password) => {
        try {
            logger.debug('userContext.js', 'loginWithStoredCredentials', 'Tentative de connexion avec identifiants stockés', { username });

            if (needReload) {
                logger.info('userContext.js', 'loginWithStoredCredentials', 'Redémarrage requis, connexion impossible');
                return toast.info('Redémarrage demandé', 'Veuillez fermer et redémarrer l\'application');
            }

            const apiResponse = await userService.login(username, password);
            const result = ApiClient.handleApiResponse(apiResponse);

            if (result.success) {
                logger.info('userContext.js', 'loginWithStoredCredentials', 'Connexion réussie avec identifiants stockés', { username });

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
                logger.warn('userContext.js', 'loginWithStoredCredentials', 'Échec de connexion avec identifiants stockés', {
                    title: result.title,
                    detail: result.detail
                });

                toast.error({
                    title: result.title,
                    description: result.detail
                });
            }
        } catch (err) {
            logger.error('userContext.js', 'loginWithStoredCredentials', 'Erreur critique de connexion', err);
            console.error('Erreur de connexion avec identifiants stockés', err);
            toast.error({
                title: 'Erreur de connexion avec identifiants stockés',
                description: err.message
            });
        }
    };

    /**
     * @description Connexion avec identifiant et mot de passe
     * @param {string} username - Nom d'utilisateur
     * @param {string} password - Mot de passe
     * @param {boolean} rememberMe - Option pour mémoriser les identifiants
     * @param {string|number} profileId - Identifiant du profil (optionnel)
     */
    const login = async (username, password, rememberMe = false, profileId = "") => {
        try {
            logger.debug('userContext.js', 'login', 'Tentative de connexion', { username, rememberMe, hasProfileId: !!profileId });

            if (needReload) {
                logger.info('userContext.js', 'login', 'Redémarrage requis, connexion impossible');
                return toast.info('Redémarrage demandé', 'Veuillez fermer et redémarrer l\'application');
            }

            setLoading(true);

            // Appel au service d'authentification
            const apiResponse = await userService.login(username, password, profileId);
            const result = ApiClient.handleApiResponse(apiResponse);

            if (result.success) {
                logger.info('userContext.js', 'login', 'Connexion réussie', { username, rememberMe });

                setUserData(result.data.userData);
                setUserRoutes(result.data.routes);
                setUserCookies(result.data.cookies);

                // Mise à jour de l'état d'authentification
                setIsAuthenticated(true);
                setNeedsPasswordOnly(false);

                setCredientials({ username, password });

                // Si "Se souvenir de moi" est coché, stocker les identifiants
                if (rememberMe) {
                    logger.debug('userContext.js', 'login', 'Sauvegarde des identifiants', { username });
                    await SecureStore.setItemAsync(STORAGE_KEYS.USERNAME, username);
                    await SecureStore.setItemAsync(STORAGE_KEYS.PASSWORD, password);
                    await SecureStore.setItemAsync(STORAGE_KEYS.REMEMBER_ME, 'true');
                }

                logger.info('UserContext.jsx', 'login', 'Utilisateur connecté avec succès');
                toast.success({
                    title: result.title,
                    duration: 3000,
                    position: toast.positions.TOP
                });
            } else {
                logger.warn('userContext.js', 'login', 'Échec de connexion', {
                    title: result.title,
                    detail: result.detail
                });
                toast.warning(result.title, result.detail);
            }
        } catch (err) {
            logger.error('userContext.js', 'login', 'Erreur critique de connexion', err);
            console.error('Erreur de connexion:', err);
            toast.error({
                title: "Une erreur est survenue lors de la connexion",
                duration: 3000,
                position: toast.positions.TOP
            });
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    /**
     * @description Connexion avec le mot de passe uniquement
     * @info Utilisé lorsque la biométrie échoue ou n'est pas disponible
     */
    const loginWithPasswordOnly = async (password) => {
        try {
            logger.debug('userContext.js', 'loginWithPasswordOnly', 'Tentative de connexion avec mot de passe uniquement');
            setLoading(true);

            if (!storedUsername) {
                logger.warn('userContext.js', 'loginWithPasswordOnly', 'Tentative de connexion sans nom d\'utilisateur stocké');
                return toast.error({
                    title: 'Nom d\'utilisateur non trouvé.',
                    description: 'Veuillez vous connecter avec vos identifiants complets.'
                });
            }

            logger.info('userContext.js', 'loginWithPasswordOnly', 'Connexion avec utilisateur stocké', { username: storedUsername });
            await login(storedUsername, password, true);
        } catch (err) {
            logger.error('userContext.js', 'loginWithPasswordOnly', 'Erreur lors de la connexion avec mot de passe uniquement', err);
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
     * @description Rafraîchit les cookies de l'utilisateur en utilisant les identifiants stockés dans l'état ou dans le SecureStore.
     *
     * @info La fonction tente d'abord d'utiliser les identifiants disponibles dans l'état actuel.
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
     * @description Déconnexion de l'utilisateur
     * Supprime toutes les données stockées dans SecureStore
     */
    const logout = async (notif) => {
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

            if (notif) return;

            toast.success({
                title: 'Déconnexion Réussi',
                duration: 3000,
                position: toast.positions.TOP
            });
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
     * @description Récupère les données du calendrier de l'utilisateur
     * @param {string} path - Chemin pour accéder au calendrier
     * @returns {Promise<Object>} Objet contenant le statut de la requête et les données ou l'erreur
     */
    const getCalendar = async (path) => {
        try {
            setError(null);

            // Fonction pour effectuer la requête du calendrier
            const fetchCalendar = async () => {
                const calendar = await userService.getCalendar(path, userCookies);
                return ApiClient.handleApiResponse(calendar);
            };

            // Première tentative de récupération du calendrier
            let result = await fetchCalendar();

            // Si erreur 400 (session expirée), on rafraîchit les cookies et on réessaie
            if (!result.success && result.statusCode === 400) {
                const { success: refreshSuccess } = await refreshCookies();

                if (refreshSuccess) {
                    // Deuxième tentative avec les nouveaux cookies
                    result = await fetchCalendar();
                }
            }

            // Traitement du résultat final
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                return { success: false, error: result };
            }
        } catch (err) {
            console.error('Erreur lors de la récupération du calendrier:', err);
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
     * @description Récupère les clés du calendrier de l'utilisateur
     * @returns {Promise<Object>} Objet contenant le statut de la requête et les données de la clé ou l'erreur
     */
    const getCalendarKey = async () => {
        try {
            setError(null);

            // Trouver le chemin du calendrier
            const emploiDuTemps = userRoutes?.find(route => route.title === "Mon emploi du temps");
            const calendrier = emploiDuTemps?.items?.find(item => item.title === "Mon calendrier");

            if (!calendrier?.route) {
                return {
                    success: false,
                    error: {
                        title: "Route du calendrier non trouvée",
                        detail: "Impossible de trouver la section 'Mon calendrier' dans le menu"
                    }
                };
            }

            // Fonction pour effectuer la requête de la clé du calendrier
            const fetchCalendarKey = async () => {
                const apiResponse = await userService.getCalendarKey(calendrier.route, userCookies);
                return ApiClient.handleApiResponse(apiResponse);
            };

            // Première tentative de récupération de la clé
            let result = await fetchCalendarKey();

            // Si erreur 400 (session expirée), on rafraîchit les cookies et on réessaie
            if (!result.success && result.statusCode >= 400 && result.statusCode < 500) {
                const { success: refreshSuccess } = await refreshCookies();

                if (refreshSuccess) {
                    // Deuxième tentative avec les nouveaux cookies
                    result = await fetchCalendarKey();
                }
            }

            // Traitement du résultat final
            if (result.success) {
                return { success: true, data: { key: result.data } };
            } else {
                return { success: false, error: result };
            }
        } catch (err) {
            console.error('Erreur lors de la récupération de la clé du calendrier:', err);
            setError(err.message);
            return {
                success: false,
                error: {
                    title: 'Une erreur est survenue',
                    detail: err.message || ''
                }
            };
        }
    };

    /**
     * @description Récupère les données des absences de l'utilisateur
     * @returns {Promise<Object>} Objet contenant le statut de la requête et les données de la clé ou l'erreur
     */
    const getAbsences = async () => {
        try {
            setError(null);
            const absences = userRoutes.find(route => route.title === "Mes absences");

            if (!absences?.route) {
                return {
                    success: false,
                    error: {
                        title: "Route des absences non trouvée",
                        detail: "Impossible de trouver la section 'Mes absences' dans le menu"
                    }
                };
            }

            const fetchAbsences = async () => {
                const apiResponse = await userService.getAbsences(absences.route, userCookies);
                return ApiClient.handleApiResponse(apiResponse);
            }

            let result = await fetchAbsences();

            // Si erreur 400 (session expirée), on rafraîchit les cookies et on réessaie
            if (!result.success && result.statusCode >= 400 && result.statusCode < 500) {
                const { success: refreshSuccess } = await refreshCookies();

                if (refreshSuccess) {
                    // Deuxième tentative avec les nouveaux cookies
                    result = await fetchAbsences();
                }
            }

            // Traitement du résultat final
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
     * @description Récupère les notes de l'utilisateur
     * @returns {Promise<Object>} Objet contenant le statut de la requête et les données de la clé ou l'erreur
     */
    const getGrades = async () => {
        try {
            const myGrades = userRoutes?.find(route => route.title === "Mes notes");
            const grades = myGrades?.items?.find(item => item.title === "Mes évaluations");

            if (!grades?.route) {
                return {
                    success: false,
                    error: {
                        title: "Route du des notes non trouvée",
                        detail: "Impossible de trouver la section 'Mes notes' dans le menu"
                    }
                };
            }

            const fetchGrades = async () => {
                const apiResponse = await userService.getGrades(grades.route, userCookies);
                return ApiClient.handleApiResponse(apiResponse);

            }

            let result = await fetchGrades()

            // Si erreur 400 (session expirée), on rafraîchit les cookies et on réessaie
            if (!result.success && result.statusCode >= 400 && result.statusCode < 500) {
                const { success: refreshSuccess } = await refreshCookies();

                if (refreshSuccess) {
                    // Deuxième tentative avec les nouveaux cookies
                    result = await fetchGrades();
                }
            }

            // Traitement du résultat final
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
    * @description Récupère un identifiant unique
    */
    const getUpdate = async () => {
        try {
            setError(null);
            const result = await userService.getUpdate();
            if (result.errors.length > 0) return

            const data = result.data[`last_release_${version.split(' ')[1].toLowerCase()}`]

            const newVersionAvailable = userService.isNewerVersion(version, data.version)
            if (!newVersionAvailable || !data.authorized) return

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
    };

    const removeAllData = async (devMode = false, setApiEndpoint, setShowEnvironment, setExpandedSection) => {
        // Afficher un toast de chargement
        const { success, error } = toast.loading('Suppression des données en cours...');
        try {

            // 1. Effacer AsyncStorage
            await AsyncStorage.clear();
            await SecureStore.deleteItemAsync(STORAGE_KEYS.ID);

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
                error('Une erreur est survenue', 'Erreur pendant le nettoyage des fichiers')
                console.warn('Erreur pendant le nettoyage des fichiers:', e);
            }

            if (devMode) {
                // 3. Réinitialiser les états de l'application
                setApiEndpoint('https://studx.ddns.net/api/v1');
                setShowEnvironment(false);
                setExpandedSection(null);
            }

            // 4. Afficher un message de succès
            success('Données effacées', 'Les données ont été supprimées');

            // 5. Demander un redémarrage manuel
            setTimeout(async () => {
                setNeedReload(true);
                await logout();
                toast.info('Redémarrage demandé', 'Veuillez redémarrer l\'application pour appliquer les changements', {
                    duration: 3000,
                    position: toast.positions.TOP
                });
            }, 1000);

            return true
        } catch (error) {
            console.error('Erreur lors de la suppression des données:', error);
            toast.error('Erreur partielle lors de la suppression', {
                duration: 2500,
                position: toast.positions.TOP
            });
            return false;
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
        getAbsences,
        getGrades,
        getUpdate,
        getUniqueID,

        removeAllData
    };

    return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
};

export default UserContext;
