import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, StatusBar, Dimensions, Animated, Modal, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import CheckBox from 'expo-checkbox';
import { useUser } from '../hooks/useUser';

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [timer, setTimer] = useState(3);
    const [canAccept, setCanAccept] = useState(false);

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

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
            <LinearGradient
                colors={['#4158D0', '#C850C0', '#FFCC70']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            />

            <Animated.View
                style={[
                    styles.logoContainer,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: translateY }],
                    },
                ]}
            >
                {/* Remplacer ceci par votre logo */}
                <Image
                    source={require('../../assets/studx.png')}
                    style={styles.logoImg}
                />
                <Text style={styles.logoText}>StudX</Text>
                <Text style={styles.tagline}>Gérez votre scolarité en toute simplicité</Text>
            </Animated.View>

            <View style={{ justifyContent: "flex-end", flex: 1 }}>
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
                                    Bon retour, <Text style={styles.emailHighlight}>{storedUsername}</Text>
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
                                onPress={async () => await logout()}
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

                    {/* Affichage des erreurs du contexte */}
                    {error && <Text style={styles.errorText}>{error}</Text>}
                </Animated.View>

                <View style={styles.footer}>
                    <View style={styles.footerText}>
                        <Text>Pas encore de compte ?</Text>
                        <Text style={styles.footerLink}>Contactez votre administration</Text>
                    </View>
                </View>
            </View>

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
    );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
        minHeight: 765,
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
        marginTop: height * 0.1,
        marginBottom: height * 0.05,
    },
    logoText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        marginTop: 10,
    },
    logoImg: {
        width: 80,
        height: 80,
        borderRadius: 50,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    tagline: {
        color: 'white',
        fontSize: 16,
        marginTop: 10,
        textAlign: 'center',
        fontWeight: '500',
    },
    formContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 20,
        paddingTop: 30,
        paddingBottom: 20,
    },
    welcomeBackContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    welcomeBack: {
        fontSize: 18,
        color: '#333',
        textAlign: 'center',
    },
    emailHighlight: {
        color: '#4158D0',
        fontWeight: 'bold',
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        color: '#333',
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#F5F5F5',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#EBEBEB',
    },
    inputError: {
        borderColor: '#FF3B30',
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 12,
        marginTop: 4,
    },
    rememberMeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    checkbox: {
        marginRight: 10,
    },
    rememberMeText: {
        fontSize: 14,
        color: '#333',
    },
    loginButton: {
        backgroundColor: '#4158D0',
        borderRadius: 10,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: '#4158D0',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
        marginBottom: 16,
    },
    loginButtonDisabled: {
        backgroundColor: '#A0A0A0',
    },
    loginButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    biometricButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#4158D0',
        borderRadius: 10,
        backgroundColor: 'transparent',
        marginBottom: 16,
    },
    biometricText: {
        color: '#4158D0',
        fontSize: 16,
        marginLeft: 10,
    },
    useAnotherAccountButton: {
        padding: 10,
        alignItems: 'center',
    },
    useAnotherAccountText: {
        color: '#4158D0',
        fontSize: 16,
    },
    footer: {
        padding: 20,
        alignItems: 'center',
        backgroundColor: 'white'
    },
    footerText: {
        alignItems: 'center',
        color: '#666',
        fontSize: 14,
    },
    footerLink: {
        color: '#4158D0',
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        width: '100%',
        maxWidth: 500,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#4158D0',
    },
    modalText: {
        fontSize: 15,
        marginBottom: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    modalCancelButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DDD',
        flex: 1,
        marginRight: 10,
        alignItems: 'center',
    },
    modalCancelText: {
        color: '#666',
        fontWeight: '500',
    },
    modalAcceptButton: {
        backgroundColor: '#4158D0',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        flex: 1,
        marginLeft: 10,
        alignItems: 'center',
    },
    modalAcceptButtonDisabled: {
        backgroundColor: '#A0A0A0',
    },
    modalAcceptText: {
        color: 'white',
        fontWeight: '500',
    },
});

export default LoginScreen;
