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

    // Fonction utilitaire pour traiter différents formats d'arguments
    const normalizeArguments = (titleOrConfig, descriptionOrOptions = {}, maybeOptions = {}) => {
        // Si le premier argument est un objet avec une propriété title ou message
        if (typeof titleOrConfig === 'object' && titleOrConfig !== null && (titleOrConfig.title || titleOrConfig.message)) {
            return titleOrConfig;
        }

        // Si le second argument est une chaîne, c'est une description
        if (typeof descriptionOrOptions === 'string') {
            return {
                title: titleOrConfig,
                description: descriptionOrOptions,
                ...maybeOptions
            };
        }

        // Sinon, c'est un ancien appel: message (maintenant title), options
        return {
            title: titleOrConfig,
            ...descriptionOrOptions
        };
    };

    // Méthodes d'aide pour chaque type de toast avec support des deux formats
    const success = useCallback((titleOrConfig, descriptionOrOptions = {}, maybeOptions = {}) => {
        const config = normalizeArguments(titleOrConfig, descriptionOrOptions, maybeOptions);
        return addToast({
            ...config,
            type: ToastType.SUCCESS
        });
    }, [addToast]);

    const error = useCallback((titleOrConfig, descriptionOrOptions = {}, maybeOptions = {}) => {
        const config = normalizeArguments(titleOrConfig, descriptionOrOptions, maybeOptions);
        return addToast({
            ...config,
            type: ToastType.ERROR
        });
    }, [addToast]);

    const warning = useCallback((titleOrConfig, descriptionOrOptions = {}, maybeOptions = {}) => {
        const config = normalizeArguments(titleOrConfig, descriptionOrOptions, maybeOptions);
        return addToast({
            ...config,
            type: ToastType.WARNING
        });
    }, [addToast]);

    const info = useCallback((titleOrConfig, descriptionOrOptions = {}, maybeOptions = {}) => {
        const config = normalizeArguments(titleOrConfig, descriptionOrOptions, maybeOptions);
        return addToast({
            ...config,
            type: ToastType.INFO
        });
    }, [addToast]);

    const refresh = useCallback((titleOrConfig, descriptionOrOptions = {}, maybeOptions = {}) => {
        const config = normalizeArguments(titleOrConfig, descriptionOrOptions, maybeOptions);
        return addToast({
            ...config,
            type: ToastType.REFRESH
        });
    }, [addToast]);

    // Méthode utilitaire pour créer un toast avec une action - mise à jour pour le nouveau format
    const withAction = useCallback((titleOrConfig, actionTextOrDescription, onActionOrActionText, optionsOrOnAction = {}, maybeOptions = {}) => {
        // Si premier argument est un objet de configuration complète
        if (typeof titleOrConfig === 'object' && titleOrConfig !== null && (titleOrConfig.title || titleOrConfig.message)) {
            const { action, ...restConfig } = titleOrConfig;
            return addToast({
                ...restConfig,
                action: action || {
                    text: actionTextOrDescription,
                    onPress: onActionOrActionText
                }
            });
        }

        // Si troisième argument est une fonction, c'est le nouveau format (title, description, onAction, options)
        if (typeof onActionOrActionText === 'function') {
            return addToast({
                title: titleOrConfig,
                description: actionTextOrDescription,
                action: {
                    text: optionsOrOnAction.actionText || "Action",
                    onPress: onActionOrActionText
                },
                ...maybeOptions
            });
        }

        // Sinon c'est l'ancien format (message, actionText, onAction, options)
        return addToast({
            title: titleOrConfig,
            action: {
                text: actionTextOrDescription,
                onPress: onActionOrActionText
            },
            ...optionsOrOnAction
        });
    }, [addToast]);

    // Toast qui reste jusqu'à ce qu'on clique dessus
    const persistent = useCallback((titleOrConfig, descriptionOrOptions = {}, maybeOptions = {}) => {
        const config = normalizeArguments(titleOrConfig, descriptionOrOptions, maybeOptions);
        return addToast({
            ...config,
            isPersistent: true
        });
    }, [addToast]);

    // Toast éphémère très court (comme un feedback rapide)
    const quick = useCallback((titleOrConfig, descriptionOrOptions = {}, maybeOptions = {}) => {
        const config = normalizeArguments(titleOrConfig, descriptionOrOptions, maybeOptions);
        return addToast({
            ...config,
            duration: 1500
        });
    }, [addToast]);

    // Toast longue durée (pour les messages importants)
    const long = useCallback((titleOrConfig, descriptionOrOptions = {}, maybeOptions = {}) => {
        const config = normalizeArguments(titleOrConfig, descriptionOrOptions, maybeOptions);
        return addToast({
            ...config,
            duration: 8000
        });
    }, [addToast]);

    // Toast de chargement qui sera remplacé par un autre toast
    const loading = useCallback((titleOrConfig = "Chargement en cours...", descriptionOrOptions = {}, maybeOptions = {}) => {
        // Si le premier argument est une chaîne, on le traite comme un titre
        const config = typeof titleOrConfig === 'string'
            ? { title: titleOrConfig, ...(typeof descriptionOrOptions === 'string' ? { description: descriptionOrOptions, ...maybeOptions } : descriptionOrOptions) }
            : titleOrConfig;

        const id = addToast({
            ...config,
            type: ToastType.REFRESH,
            isPersistent: true
        });

        // Retourne des fonctions pour mettre à jour ce toast
        return {
            id,
            // Remplace le toast de chargement par un toast de succès
            success: (newTitleOrConfig, newDescriptionOrOptions = {}, newMaybeOptions = {}) => {
                removeToast(id);
                return success(newTitleOrConfig, newDescriptionOrOptions, newMaybeOptions);
            },
            // Remplace le toast de chargement par un toast d'erreur
            error: (newTitleOrConfig, newDescriptionOrOptions = {}, newMaybeOptions = {}) => {
                removeToast(id);
                return error(newTitleOrConfig, newDescriptionOrOptions, newMaybeOptions);
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
