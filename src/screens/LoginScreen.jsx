import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    Dimensions,
    Animated,
    Modal,
    ActivityIndicator,
    ScrollView,
    Keyboard,
    TouchableWithoutFeedback,
    Pressable
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import CheckBox from 'expo-checkbox';
import { useUser } from '../hooks/useUser';
import useToast from '../hooks/useToast';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const LoginScreen = () => {
    const toast = useToast();
    const navigation = useNavigation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [timer, setTimer] = useState(3);
    const [canAccept, setCanAccept] = useState(false);
    const [keyboardVisible, setKeyboardVisible] = useState(false);

    const [devMode, setDevMode] = useState(false);
    const [compteurClics, setCompteurClics] = useState(0);
    const timerRef = useRef(null);

    // Animation values
    const fadeAnim = useState(new Animated.Value(0))[0];
    const translateY = useState(new Animated.Value(50))[0];

    // Récupération du contexte utilisateur
    const {
        login,
        loginWithPasswordOnly,
        loading,
        error,
        logout,
        needsPasswordOnly,
        storedUsername
    } = useUser();

    // Pré-remplir l'email s'il est stocké
    useEffect(() => {
        if (storedUsername) {
            setEmail(storedUsername);
        }
    }, [storedUsername]);

    // Start animations when component mounts
    useEffect(() => {
        const animation = Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
        ]);

        animation.start();

        return () => {
            animation.stop(); // Properly stop animations on unmount
        };
    }, []);

    // Timer for modal
    useEffect(() => {
        let interval;

        if (modalVisible && timer > 0) {
            interval = setInterval(() => {
                setTimer((prevTimer) => prevTimer - 1);
            }, 1000);
        } else if (timer === 0) {
            setCanAccept(true);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [modalVisible, timer]);

    // Keyboard listeners
    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            () => setKeyboardVisible(true)
        );
        const keyboardDidHideListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setKeyboardVisible(false)
        );

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const handleRememberMeChange = () => {
        if (!rememberMe) {
            // Show modal when user wants to enable "Remember Me"
            setModalVisible(true);
            setTimer(3);
            setCanAccept(false);
        } else {
            // Just disable it if it was already enabled
            setRememberMe(false);
        }
    };

    const acceptRememberMe = () => {
        setRememberMe(true);
        setModalVisible(false);
    };

    const cancelRememberMe = () => {
        setRememberMe(false);
        setModalVisible(false);
    };

    const handleLogin = async () => {
        let isValid = true;

        // Reset errors
        setEmailError('');
        setPasswordError('');

        // Validate email
        if (!email) {
            setEmailError('Email obligatoire');
            isValid = false;
        } else if (!validateEmail(email)) {
            setEmailError('Email invalide');
            isValid = false;
        }

        // Validate password
        if (!password) {
            setPasswordError('Mot de passe obligatoire');
            isValid = false;
        } else if (password.length < 6) {
            setPasswordError('Le mot de passe doit contenir au moins 6 caractères');
            isValid = false;
        }

        if (isValid) {
            // Si nous sommes en mode "mot de passe uniquement"
            if (needsPasswordOnly) {
                await loginWithPasswordOnly(password);
            } else {
                // Connexion normale avec email et mot de passe
                await login(email, password, rememberMe);
            }
        }
    };

    const dismissKeyboard = () => {
        Keyboard.dismiss();
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

    const handleNavLog = () => {
        navigation.navigate('Logs')
    }

    return (
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <KeyboardAvoidingView
                behavior={keyboardVisible ? (Platform.OS === 'ios' ? 'padding' : 'height' ) : null }
                keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
                style={styles.container}
            >
                <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
                <LinearGradient
                    colors={['#4158D0', '#C850C0', '#FFCC70']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradient}
                />

                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        // keyboardVisible ? { paddingBottom: 20 } : null
                    ]}
                    bounces={false}
                    showsVerticalScrollIndicator={false}
                >
                    {devMode && (
                        <TouchableOpacity style={{ top: 55, left: 20, flexDirection: 'row', gap: 10 }} onPress={handleNavLog} onLongPress={() => setDevMode(false)}>
                            <Ionicons name="code" size={20} color="#FFF" />
                            <Text style={{ color: '#FFF' }}>Mode développeur</Text>
                        </TouchableOpacity>
                    )}

                    <Animated.View
                        style={[
                            styles.logoContainer,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: translateY }],
                            },
                        ]}
                    >
                        <Pressable onPress={clicAvatar}>
                            <Image
                                source={require('../../assets/studx.png')}
                                style={styles.logoImg}
                            />
                        </Pressable>
                        <Text style={styles.logoText}>StudX</Text>
                        <Text style={styles.tagline}>Gérez votre scolarité en toute simplicité</Text>
                    </Animated.View>

                    <Animated.View
                        style={[
                            styles.formContainer,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: translateY }],
                            },
                        ]}
                    >
                        {/* Affichage conditionnel basé sur needsPasswordOnly */}
                        {needsPasswordOnly ? (
                            <>
                                <View style={styles.welcomeBackContainer}>
                                    <Text style={styles.welcomeBack}>
                                        Bon retour, <Text style={styles.emailHighlight}>{storedUsername.split('.')[0].split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('-')}</Text>
                                    </Text>
                                </View>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Mot de passe</Text>
                                    <TextInput
                                        style={[styles.input, passwordError ? styles.inputError : null]}
                                        placeholder="••••••••"
                                        placeholderTextColor="#A0A0A0"
                                        secureTextEntry
                                        value={password}
                                        onChangeText={(text) => {
                                            setPassword(text);
                                            if (passwordError) setPasswordError('');
                                        }}
                                    />
                                    {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
                                </View>

                                <TouchableOpacity
                                    style={[styles.loginButton, loading ? styles.loginButtonDisabled : null]}
                                    onPress={handleLogin}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text style={styles.loginButtonText}>Se connecter</Text>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.useAnotherAccountButton}
                                    onPress={async () => await logout(false)}
                                >
                                    <Text style={styles.useAnotherAccountText}>Utiliser un autre compte</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Email</Text>
                                    <TextInput
                                        style={[styles.input, emailError ? styles.inputError : null]}
                                        placeholder="prenom.nom@esme.fr"
                                        placeholderTextColor="#A0A0A0"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        value={email}
                                        onChangeText={(text) => {
                                            setEmail(text);
                                            if (emailError) setEmailError('');
                                        }}
                                    />
                                    {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
                                </View>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Mot de passe</Text>
                                    <TextInput
                                        style={[styles.input, passwordError ? styles.inputError : null]}
                                        placeholder="••••••••"
                                        placeholderTextColor="#A0A0A0"
                                        secureTextEntry
                                        value={password}
                                        onChangeText={(text) => {
                                            setPassword(text);
                                            if (passwordError) setPasswordError('');
                                        }}
                                    />
                                    {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
                                </View>

                                <View style={styles.rememberMeContainer}>
                                    <CheckBox
                                        value={rememberMe}
                                        onValueChange={handleRememberMeChange}
                                        color={rememberMe ? '#4158D0' : undefined}
                                        style={styles.checkbox}
                                    />
                                    <Text style={styles.rememberMeText}>Se souvenir de moi</Text>
                                </View>

                                <TouchableOpacity
                                    style={[styles.loginButton, loading ? styles.loginButtonDisabled : null]}
                                    onPress={handleLogin}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text style={styles.loginButtonText}>Se connecter</Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Pas encore de compte ?</Text>
                            <TouchableOpacity>
                                <Text style={styles.footerLink}>Contactez votre administration</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </ScrollView>

                {/* Modal pour "Se souvenir de moi" */}
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={cancelRememberMe}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Enregistrer vos identifiants</Text>
                            <Text style={styles.modalText}>
                                En activant cette option, vos identifiants seront stockés de manière sécurisée
                                sur votre appareil. Cela vous permettra de vous connecter plus rapidement
                                la prochaine fois, y compris via l'authentification biométrique si disponible.
                            </Text>
                            <Text style={styles.modalText}>
                                Vos données ne sont stockées qu'en local et ne sont jamais transmises à des tiers.
                            </Text>

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={styles.modalCancelButton}
                                    onPress={cancelRememberMe}
                                >
                                    <Text style={styles.modalCancelText}>Annuler</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.modalAcceptButton,
                                        !canAccept && styles.modalAcceptButtonDisabled
                                    ]}
                                    onPress={acceptRememberMe}
                                    disabled={!canAccept}
                                >
                                    <Text style={styles.modalAcceptText}>
                                        {canAccept ? "Accepter" : `Accepter (${timer}s)`}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
    );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'space-between',
        minHeight: height,
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: height,
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: height * 0.12,
        paddingBottom: 20,
    },
    logoText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: 'white',
        marginTop: 12,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 4,
    },
    logoImg: {
        width: 90,
        height: 90,
        borderRadius: 45,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 6,
        },
        shadowOpacity: 0.35,
        shadowRadius: 6.5,
        elevation: 10,
    },
    tagline: {
        color: 'white',
        fontSize: 18,
        marginTop: 12,
        textAlign: 'center',
        fontWeight: '500',
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0.5, height: 0.5 },
        textShadowRadius: 2,
    },
    formContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 24,
        paddingTop: 36,
        paddingBottom: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -3,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4.65,
        elevation: 6,
        marginTop: 'auto',
    },
    welcomeBackContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    welcomeBack: {
        fontSize: 20,
        color: '#333',
        textAlign: 'center',
    },
    emailHighlight: {
        color: '#4158D0',
        fontWeight: 'bold',
    },
    inputContainer: {
        marginBottom: 22,
    },
    label: {
        fontSize: 15,
        color: '#333',
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#F8F8F8',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#EBEBEB',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    inputError: {
        borderColor: '#FF3B30',
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 13,
        marginTop: 5,
        marginLeft: 2,
    },
    rememberMeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    checkbox: {
        marginRight: 12,
        borderRadius: 4,
        height: 20,
        width: 20,
    },
    rememberMeText: {
        fontSize: 15,
        color: '#333',
    },
    loginButton: {
        backgroundColor: '#4158D0',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: '#4158D0',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
        marginBottom: 16,
    },
    loginButtonDisabled: {
        backgroundColor: '#A0A0A0',
    },
    loginButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    useAnotherAccountButton: {
        padding: 12,
        alignItems: 'center',
    },
    useAnotherAccountText: {
        color: '#4158D0',
        fontSize: 16,
        fontWeight: '500',
    },
    footer: {
        marginTop: 20,
        alignItems: 'center',
    },
    footerText: {
        color: '#666',
        fontSize: 15,
        marginBottom: 4,
    },
    footerLink: {
        color: '#4158D0',
        fontWeight: '600',
        fontSize: 15,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 15,
        width: '100%',
        maxWidth: 500,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 20,
        textAlign: 'center',
        color: '#4158D0',
    },
    modalText: {
        fontSize: 16,
        marginBottom: 15,
        textAlign: 'center',
        lineHeight: 24,
        color: '#444',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 24,
    },
    modalCancelButton: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#DDD',
        flex: 1,
        marginRight: 5,
        alignItems: 'center',
    },
    modalCancelText: {
        color: '#666',
        fontWeight: '600',
        fontSize: 16,
    },
    modalAcceptButton: {
        backgroundColor: '#4158D0',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        flex: 1,
        marginLeft: 5,
        alignItems: 'center',
    },
    modalAcceptButtonDisabled: {
        backgroundColor: '#A0A0A0',
    },
    modalAcceptText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
});

export default LoginScreen;
