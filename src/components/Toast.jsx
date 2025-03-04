import { useRef, useEffect, useState } from 'react';
import { View, Text, Animated, StyleSheet, TouchableOpacity, Platform, Pressable } from 'react-native';
import { CheckCircle2, XCircle, AlertCircle, Info, RefreshCcw, ArrowRight } from 'lucide-react-native';
import { SCREEN } from '../styles/theme';
import { ANIMATION_DURATION, ToastType, ToastPosition } from '../hooks/useToast';

const ToastComponent = ({
    id,
    message,
    type,
    onHide,
    index = 0,
    timestamp,
    duration,
    position = ToastPosition.TOP,
    action,
    data,
    isPersistent = false,
    onHeightChange, // Nouvelle prop pour communiquer la hauteur
    heightOffset = 0 // Nouvelle prop pour l'offset basé sur les toasts précédents
}) => {
    const translateY = useRef(new Animated.Value(position === ToastPosition.BOTTOM ? 100 : -100)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.8)).current;
    const progress = useRef(new Animated.Value(0)).current;
    const [toastHeight, setToastHeight] = useState(0); // Nouvel état pour stocker la hauteur

    // État pour suivre si le toast est en train d'être supprimé
    const [isExiting, setIsExiting] = useState(false);
    // Pour le tracking des animations
    const animationsRef = useRef({});


    // Calcul de la position initiale et finale en fonction de la position du toast
    const getPositionForAnimation = () => {
        if (position === ToastPosition.TOP) {
            return heightOffset + (index > 0 ? 10 : 0); // 10px d'espacement entre les toasts
        } else if (position === ToastPosition.BOTTOM) {
            return -(heightOffset + (index > 0 ? 10 : 0)); // Espacement négatif pour le bas
        } else { // CENTER
            return 0;
        }
    };

    // Mesurer la hauteur du toast après le rendu
    useEffect(() => {
        if (toastHeight > 0 && onHeightChange) {
            onHeightChange(id, toastHeight);
        }
    }, [toastHeight, id, onHeightChange]);

    // Gestion des animations d'entrée et de sortie
    useEffect(() => {
        const entryAnimation = Animated.parallel([
            Animated.timing(translateY, {
                toValue: getPositionForAnimation(),
                duration: ANIMATION_DURATION,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: ANIMATION_DURATION,
                useNativeDriver: true,
            }),
            Animated.spring(scale, {
                toValue: 1,
                damping: 15,
                mass: 1,
                stiffness: 200,
                useNativeDriver: true,
            }),
        ]);

        // Animation de la barre de progression seulement si pas persistent
        let progressAnimation = null;
        let exitTimer = null;

        if (!isPersistent && duration > 0) {
            progressAnimation = Animated.timing(progress, {
                toValue: 1,
                duration: duration,
                useNativeDriver: false,
            });

            progressAnimation.start();

            exitTimer = setTimeout(() => {
                handleHide();
            }, duration);
        }

        // Démarrage de l'animation d'entrée
        entryAnimation.start();

        // Stockage des références d'animation pour le nettoyage
        animationsRef.current = {
            entry: entryAnimation,
            progress: progressAnimation,
            exitTimer: exitTimer,
        };

        return () => {
            if (exitTimer) {
                clearTimeout(exitTimer);
            }

            if (entryAnimation) {
                entryAnimation.stop();
            }

            if (progressAnimation) {
                progressAnimation.stop();
            }
        };
    }, [index, duration, position, isPersistent, heightOffset]);

    // Fonction pour déclencher l'animation de sortie
    const handleHide = () => {
        if (isExiting) return;

        setIsExiting(true);

        if (animationsRef.current.exitTimer) {
            clearTimeout(animationsRef.current.exitTimer);
        }

        const exitAnimation = Animated.parallel([
            Animated.timing(translateY, {
                toValue: position === ToastPosition.BOTTOM ? 100 : -100,
                duration: ANIMATION_DURATION,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: ANIMATION_DURATION,
                useNativeDriver: true,
            }),
            Animated.timing(scale, {
                toValue: 0.8,
                duration: ANIMATION_DURATION,
                useNativeDriver: true,
            }),
        ]);

        exitAnimation.start(({ finished }) => {
            if (finished && onHide) {
                onHide();
            }
        });

        animationsRef.current.exit = exitAnimation;
    };

    // Icônes selon le type de toast
    const getIcon = () => {
        const iconProps = {
            size: 24,
            color: '#FFFFFF',
            strokeWidth: 2.5
        };

        switch (type) {
            case ToastType.SUCCESS:
                return <CheckCircle2 {...iconProps} />;
            case ToastType.ERROR:
                return <XCircle {...iconProps} />;
            case ToastType.WARNING:
                return <AlertCircle {...iconProps} />;
            case ToastType.REFRESH:
                return <RefreshCcw {...iconProps} />;
            default:
                return <Info {...iconProps} />;
        }
    };

    // Couleurs selon le type de toast
    const getBackgroundColor = () => {
        switch (type) {
            case ToastType.SUCCESS:
                return ['#0F766E', '#14B8A6'];
            case ToastType.ERROR:
                return ['#9F1239', '#E11D48'];
            case ToastType.WARNING:
                return ['#B45309', '#F59E0B'];
            case ToastType.REFRESH:
                return ['#2196F3', '#BBDEFB'];
            default:
                return ['#1E40AF', '#3B82F6'];
        }
    };

    const [startColor, endColor] = getBackgroundColor();

    // Traitement de l'action si disponible
    const handleAction = () => {
        if (action && action.onPress) {
            action.onPress(data);
            handleHide();
        }
    };

    return (
        <Animated.View
            style={[
                styles.toast,
                {
                    transform: [
                        { translateY },
                        { scale }
                    ],
                    opacity,
                    ...(position === ToastPosition.BOTTOM
                        ? { bottom: 0 }
                        : position === ToastPosition.CENTER
                            ? { top: '50%', marginTop: -40 }
                            : { top: 0 }),
                },
            ]}
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            onLayout={({ nativeEvent }) => {
                const { height } = nativeEvent.layout;
                if (height !== toastHeight) {
                    setToastHeight(height);
                }
            }}
        >
            <View style={[styles.background, { backgroundColor: startColor }]} />


            <Pressable
                style={styles.content}
                onPress={isPersistent ? handleHide : null}
                android_ripple={isPersistent ? { color: 'rgba(255,255,255,0.2)' } : null}
            >
                <View style={styles.iconContainer}>{getIcon()}</View>
                <Text style={styles.message} numberOfLines={3}>{message}</Text>
                {!isPersistent && (
                    <TouchableOpacity
                        onPress={handleHide}
                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                        style={styles.closeButton}
                    >
                        <XCircle size={20} color="#FFFFFF" strokeWidth={2.5} />
                    </TouchableOpacity>
                )}
            </Pressable>

            {action && (
                <TouchableOpacity
                    style={styles.actionContainer}
                    onPress={handleAction}
                >
                    <Text style={styles.actionText}>{action.text}</Text>
                    <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.5} style={styles.actionIcon} />
                </TouchableOpacity>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    toast: {
        width: SCREEN.width - 32,
        position: 'absolute',
        borderRadius: 16,
        marginHorizontal: 16,
        overflow: 'hidden',
        zIndex: 1000,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: {
                    width: 0,
                    height: 4,
                },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    background: {
        ...StyleSheet.absoluteFillObject,
    },
    progressBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: 4,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    iconContainer: {
        marginRight: 12,
    },
    message: {
        color: '#FFFFFF',
        fontSize: 16,
        flex: 1,
        fontWeight: '600',
    },
    closeButton: {
        marginLeft: 8,
    },
    actionContainer: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.2)',
        paddingVertical: 12,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    actionIcon: {
        marginLeft: 8,
    }
});

export default ToastComponent;
