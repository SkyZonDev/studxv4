// ./src/context/toastContext.js
import React, { createContext, useCallback, useState, useRef, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import ToastComponent from '../components/Toast';
import { ToastType, ToastPosition } from '../hooks/useToast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const DEFAULT_DURATION = 4000;
export const MAX_VISIBLE_TOASTS = 3;
export const ANIMATION_DURATION = 400;

export const ToastContext = createContext(null);

export const ToastProvider = ({
    children,
    maxVisible = MAX_VISIBLE_TOASTS,
    defaultPosition = ToastPosition.TOP
}) => {
    const [toasts, setToasts] = useState([]);
    const toastQueue = useRef([]);
    const processingCount = useRef(0);
    const [toastHeights, setToastHeights] = useState({}); // Nouvel état pour les hauteurs

    // Fonction pour gérer le changement de hauteur d'un toast
    const handleToastHeightChange = useCallback((id, height) => {
        setToastHeights(prev => {
            if (prev[id] === height) return prev;
            return { ...prev, [id]: height };
        });
    }, []);

    // Fonction pour calculer l'offset de hauteur pour un toast à un index donné
    const calculateHeightOffset = useCallback((positionToasts, index) => {
        return positionToasts.slice(0, index).reduce((total, toast) => {
            const height = toastHeights[toast.id] || 0;
            return total + height + 10; // 10px d'espacement entre les toasts
        }, 0);
    }, [toastHeights]);

    // Fonction optimisée pour traiter plusieurs toasts en parallèle
    const processQueue = useCallback(() => {
        if (processingCount.current >= maxVisible || toastQueue.current.length === 0) return;

        const nextToast = toastQueue.current.shift();
        processingCount.current += 1;

        // Utiliser une seule mise à jour d'état
        setToasts(prev => {
            const newToasts = [...prev, nextToast];

            if (nextToast.duration > 0 && !nextToast.isPersistent) {
                setTimeout(() => {
                    setToasts(prev => {
                        const updatedToasts = prev.filter(t => t.id !== nextToast.id);
                        if (nextToast.onClose) {
                            nextToast.onClose();
                        }
                        return updatedToasts;
                    });
                    processingCount.current -= 1;
                    // Au lieu d'appeler processQueue directement, utiliser un timeout
                    setTimeout(processQueue, 0);
                }, nextToast.duration + ANIMATION_DURATION);
            }

            return newToasts;
        });
    }, [maxVisible]);

    const addToast = useCallback((
        message,
        type = ToastType.INFO,
        options = {}
    ) => {
        if (!message) return null;

        const {
            duration = DEFAULT_DURATION,
            position = defaultPosition,
            onClose,
            data,
            action,
            isPersistent = false,
        } = options;

        // Assurer une durée minimale de 1 seconde ou 0 pour les toasts persistants
        const normalizedDuration = isPersistent ? 0 : Math.max(1000, duration);

        const newToast = {
            id: Date.now().toString(),
            message,
            type,
            timestamp: Date.now(),
            duration: normalizedDuration,
            position,
            onClose,
            data,
            action,
            isPersistent,
        };

        toastQueue.current.push(newToast);
        requestAnimationFrame(() => {
            processQueue();
        });

        // Retourner l'ID pour permettre la suppression manuelle
        return newToast.id;
    }, [defaultPosition, processQueue]);

    const removeToast = useCallback((id) => {
        toastQueue.current = toastQueue.current.filter(toast => toast.id !== id);

        setToasts(prev => {
            const toast = prev.find(t => t.id === id);
            const isToastPersistent = toast?.isPersistent || false;

            if (toast && toast.onClose) {
                toast.onClose();
            }

            const updatedToasts = prev.filter(toast => toast.id !== id);

            if (isToastPersistent) {
                processingCount.current = Math.max(0, processingCount.current - 1);
                // Utiliser setTimeout au lieu de requestAnimationFrame
                setTimeout(processQueue, 0);
            }

            return updatedToasts;
        });
    }, [processQueue]);

    const removeAllToasts = useCallback(() => {
        toastQueue.current = [];
        setToasts(prev => {
            // Appeler onClose pour chaque toast si défini
            prev.forEach(toast => {
                if (toast.onClose) {
                    toast.onClose();
                }
            });
            return [];
        });
        processingCount.current = 0;
    }, []);

    // Groupe les toasts par position pour un rendu optimisé
    const groupedToasts = useMemo(() => {
        const groups = {};

        Object.values(ToastPosition).forEach(position => {
            groups[position] = toasts.filter(toast => toast.position === position);
        });

        return groups;
    }, [toasts]);

    // Valeur mémorisée du contexte pour éviter les re-rendus inutiles
    const contextValue = useMemo(() => ({
        addToast,
        removeToast,
        removeAllToasts
    }), [addToast, removeToast, removeAllToasts]);

    return (
        <ToastContext.Provider value={contextValue}>
            {children}

            {/* Toast container pour chaque position */}
            {Object.entries(groupedToasts).map(([position, positionToasts]) => (
                positionToasts.length > 0 && (
                    <View
                        key={position}
                        style={[
                            styles.toastContainer,
                            position === ToastPosition.TOP && styles.topContainer,
                            position === ToastPosition.BOTTOM && styles.bottomContainer,
                            position === ToastPosition.CENTER && styles.centerContainer,
                        ]}
                        pointerEvents="box-none"
                    >
                        {positionToasts.map((toast, index) => (
                            <ToastComponent
                                key={toast.id}
                                {...toast}
                                index={index}
                                onHide={() => removeToast(toast.id)}
                                onHeightChange={handleToastHeightChange}
                                heightOffset={calculateHeightOffset(positionToasts, index)}
                            />
                        ))}
                    </View>
                )
            ))}
        </ToastContext.Provider>
    );
};

const styles = StyleSheet.create({
    toastContainer: {
        position: 'absolute',
        width: SCREEN_WIDTH,
        zIndex: 999,
        pointerEvents: 'box-none',
    },
    topContainer: {
        top: Platform.OS === 'ios' ? 50 : 50,
    },
    bottomContainer: {
        bottom: Platform.OS === 'ios' ? 50 : 50,
    },
    centerContainer: {
        top: 0,
        bottom: 0,
        justifyContent: 'center',
    }
});

export default ToastProvider;
