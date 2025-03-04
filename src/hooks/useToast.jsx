// ./src/context/useToast.jsx
import { useContext, useCallback } from 'react';
import { ToastContext, DEFAULT_DURATION } from '../context/toastContext';

export const ToastType = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
    REFRESH: 'refresh'
};

export const ToastPosition = {
    TOP: 'top',
    BOTTOM: 'bottom',
    CENTER: 'center'
};

export const useToast = () => {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }

    const { addToast, removeToast, removeAllToasts } = context;

    // Méthodes d'aide pour chaque type de toast
    const success = useCallback((message, options = {}) => {
        return addToast(message, ToastType.SUCCESS, options);
    }, [addToast]);

    const error = useCallback((message, options = {}) => {
        return addToast(message, ToastType.ERROR, options);
    }, [addToast]);

    const warning = useCallback((message, options = {}) => {
        return addToast(message, ToastType.WARNING, options);
    }, [addToast]);

    const info = useCallback((message, options = {}) => {
        return addToast(message, ToastType.INFO, options);
    }, [addToast]);

    const refresh = useCallback((message, options = {}) => {
        return addToast(message, ToastType.REFRESH, options);
    }, [addToast]);

    // Méthode utilitaire pour créer un toast avec une action
    const withAction = useCallback((message, actionText, onAction, options = {}) => {
        return addToast(message, options.type || ToastType.INFO, {
            ...options,
            action: {
                text: actionText,
                onPress: onAction
            }
        });
    }, [addToast]);

    // Toast qui reste jusqu'à ce qu'on clique dessus
    const persistent = useCallback((message, type = ToastType.INFO, options = {}) => {
        return addToast(message, type, {
            ...options,
            isPersistent: true
        });
    }, [addToast]);

    // Toast éphémère très court (comme un feedback rapide)
    const quick = useCallback((message, type = ToastType.SUCCESS, options = {}) => {
        return addToast(message, type, {
            ...options,
            duration: 1500
        });
    }, [addToast]);

    // Toast longue durée (pour les messages importants)
    const long = useCallback((message, type = ToastType.INFO, options = {}) => {
        return addToast(message, type, {
            ...options,
            duration: 8000
        });
    }, [addToast]);

    // Toast de chargement qui sera remplacé par un autre toast
    const loading = useCallback((message = "Chargement en cours...", options = {}) => {
        const id = addToast(message, ToastType.REFRESH, {
            ...options,
            isPersistent: true
        });

        // Retourne des fonctions pour mettre à jour ce toast
        return {
            id,
            // Remplace le toast de chargement par un toast de succès
            success: (newMessage, newOptions = {}) => {
                removeToast(id);
                return success(newMessage, newOptions);
            },
            // Remplace le toast de chargement par un toast d'erreur
            error: (newMessage, newOptions = {}) => {
                removeToast(id);
                return error(newMessage, newOptions);
            },
            // Juste supprimer le toast
            dismiss: () => removeToast(id)
        };
    }, [addToast, removeToast, success, error]);

    return {
        // Méthode de base
        show: addToast,

        // Méthodes par type
        success,
        error,
        warning,
        info,
        refresh,

        // Méthodes avancées
        withAction,
        persistent,
        quick,
        long,
        loading,

        // Gestion
        remove: removeToast,
        removeAll: removeAllToasts,

        // Constantes exportées pour une utilisation directe
        types: ToastType,
        positions: ToastPosition,
        defaultDuration: DEFAULT_DURATION
    };
};

export default useToast;
