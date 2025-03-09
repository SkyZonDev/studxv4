import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Animated,
    Easing,
    TouchableWithoutFeedback,
    Dimensions,
    Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/themeContext';

const { width } = Dimensions.get('window');

/**
 * CustomAlert - Un composant d'alerte personnalisé et moderne pour remplacer les alertes natives
 *
 * @param {boolean} visible - Contrôle la visibilité de l'alerte
 * @param {function} onClose - Fonction appelée lorsque l'alerte est fermée
 * @param {string} type - Type d'alerte: 'success', 'error', 'warning', 'info'
 * @param {string} title - Titre de l'alerte
 * @param {string} message - Message principal de l'alerte
 * @param {array} buttons - Tableau de boutons [{text: 'Ok', onPress: () => {}, style: 'cancel|default|confirm'}]
 * @param {boolean} dismissable - Si l'alerte peut être fermée en touchant à l'extérieur
 */
const CustomAlert = ({
    visible = false,
    onClose,
    type = 'info',
    title,
    message,
    buttons = [{ text: 'OK', onPress: () => { }, style: 'default' }],
    dismissable = true
}) => {
    const { colors } = useTheme();
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    // Configuration des couleurs par type d'alerte
    const alertConfig = {
        success: {
            gradient: ['#66BB6A', '#43A047'],
            icon: 'checkmark-circle',
            backgroundColor: '#E8F5E9'
        },
        error: {
            gradient: ['#FF5252', '#D32F2F'],
            icon: 'alert-circle',
            backgroundColor: '#FFEBEE'
        },
        warning: {
            gradient: ['#FFB74D', '#F57C00'],
            icon: 'warning',
            backgroundColor: '#FFF8E1'
        },
        info: {
            gradient: ['#4A6FE1', '#6C92F4'],
            icon: 'information-circle',
            backgroundColor: '#E3F2FD'
        }
    };

    const config = alertConfig[type] || alertConfig.info;

    // Animations d'entrée et de sortie
    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 300,
                    easing: Easing.out(Easing.back(1.7)),
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(scaleAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [visible]);

    const handleBackdropPress = () => {
        if (dismissable) {
            if (onClose) onClose();
        }
    };

    const handleButtonPress = (button) => {
        if (button.onPress) button.onPress();
        if (onClose) onClose();
    };

    // Fonction pour styliser les boutons selon leur type
    const getButtonStyle = (buttonStyle) => {
        switch (buttonStyle) {
            case 'cancel':
                return {
                    container: styles.cancelButton,
                    text: { color: '#757575' }
                };
            case 'confirm':
                return {
                    container: [styles.confirmButton, { backgroundColor: config.gradient[0] }],
                    text: { color: '#FFFFFF', fontWeight: '600' }
                };
            default:
                return {
                    container: styles.defaultButton,
                    text: { color: config.gradient[0], fontWeight: '500' }
                };
        }
    };

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <StatusBar style="light" />
            <TouchableWithoutFeedback onPress={handleBackdropPress}>
                <View style={styles.modalContainer}>
                    <TouchableWithoutFeedback>
                        <Animated.View
                            style={[
                                styles.alertContainer,
                                {
                                    opacity: opacityAnim,
                                    transform: [{ scale: scaleAnim }],
                                    backgroundColor: '#FFFFFF'
                                }
                            ]}
                        >
                            {/* Header avec gradient */}
                            <LinearGradient
                                colors={config.gradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.header}
                            >
                                <View style={styles.iconContainer}>
                                    <Ionicons name={config.icon} size={28} color="#FFFFFF" />
                                </View>
                                <Text style={styles.headerTitle}>{title}</Text>
                            </LinearGradient>

                            {/* Corps de l'alerte */}
                            <View style={styles.content}>
                                <Text style={styles.message}>{message}</Text>
                            </View>

                            {/* Boutons */}
                            <View
                                style={[
                                    styles.buttonContainer,
                                    { flexDirection: buttons.length > 2 ? 'column' : 'row' }
                                ]}
                            >
                                {buttons.map((button, index) => {
                                    const buttonStyleConfig = getButtonStyle(button.style);
                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            style={[
                                                styles.button,
                                                buttonStyleConfig.container,
                                                buttons.length > 2 && { width: '100%', marginRight: 0 },
                                                index === buttons.length - 1 && { marginRight: 0 }
                                            ]}
                                            onPress={() => handleButtonPress(button)}
                                            activeOpacity={0.7}
                                        >
                                            <Text
                                                style={[styles.buttonText, buttonStyleConfig.text]}
                                            >
                                                {button.text}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingHorizontal: 20,
    },
    alertContainer: {
        width: width * 0.85,
        maxWidth: 340,
        borderRadius: 16,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 10,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginLeft: 10,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 20,
        paddingTop: 16,
        paddingBottom: 12,
    },
    message: {
        fontSize: 15,
        color: '#333333',
        lineHeight: 22,
    },
    buttonContainer: {
        padding: 16,
        paddingTop: 0,
        justifyContent: 'flex-end',
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        marginBottom: 8,
    },
    defaultButton: {
        backgroundColor: '#F5F5F5',
    },
    cancelButton: {
        backgroundColor: '#F5F5F5',
    },
    confirmButton: {
        backgroundColor: '#4A6FE1',
    },
    buttonText: {
        fontSize: 15,
        fontWeight: '500',
    },
});

export default CustomAlert;
