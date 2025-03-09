import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const version = Constants.expoConfig?.version || Constants.manifest?.version || 'non disponible';

class ApiClient {
    constructor(baseUrl = '', defaultOptions = {}) {
        this.baseUrl = baseUrl;
        this.defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'x-app-version': version,
            },
            timeout: 30000, // 30 secondes par défaut
            ...defaultOptions
        };
        this.init(); // Appel à une méthode async pour récupérer l'id
    }

    async init() {
        this.id = await this._getAppID();
        this.defaultOptions.headers['user'] = JSON.stringify({ id: this.id });
    }

    async _getAppID() {
        const id = await SecureStore.getItemAsync('unique_id');
        return id || 'id_non_trouvé';
    }

    /**
     * Configure un timeout pour les requêtes fetch
     */
    _timeoutPromise(ms) {
        return new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`La requête a expiré après ${ms} ms`));
            }, ms);
        });
    }

    /**
     * Méthode principale pour effectuer des requêtes
     */
    async request(endpoint, options = {}) {
        const url = this._buildUrl(endpoint);
        const timeout = options.timeout || this.defaultOptions.timeout;

        // Fusion des options par défaut avec les options spécifiques
        const fetchOptions = {
            ...this.defaultOptions,
            ...options,
            headers: {
                ...this.defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            // Course entre le fetch et le timeout
            const response = await Promise.race([
                fetch(url, fetchOptions),
                this._timeoutPromise(timeout)
            ]);

            // // Vérification du statut de la réponse
            // if (!response.ok) {
            //     throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
            // }

            // Détection du type de contenu pour la réponse
            const contentType = response.headers.get('content-type');

            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else if (contentType && contentType.includes('text/')) {
                return await response.text();
            } else {
                return await response.blob();
            }
        } catch (error) {
            // Gestion personnalisée des erreurs
            if (options.errorHandler) {
                return options.errorHandler(error);
            }
            throw error;
        }
    }

    /**
     * Construction de l'URL complète
     */
    _buildUrl(endpoint) {
        // Gestion des paramètres de requête
        if (typeof endpoint === 'object') {
            const { path, params } = endpoint;
            const url = new URL(this.baseUrl + path);

            // Ajout des paramètres à l'URL
            if (params) {
                Object.entries(params).forEach(([key, value]) => {
                    url.searchParams.append(key, value);
                });
            }

            return url.toString();
        }

        return this.baseUrl + endpoint;
    }

    /**
     * Méthode GET
     */
    async get(endpoint, options = {}) {
        return this.request(endpoint, {
            method: 'GET',
            ...options
        });
    }

    /**
     * Méthode POST
     */
    async post(endpoint, data, options = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
            ...options
        });
    }

    /**
     * Méthode PUT
     */
    async put(endpoint, data, options = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
            ...options
        });
    }

    /**
     * Méthode PATCH
     */
    async patch(endpoint, data, options = {}) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data),
            ...options
        });
    }

    /**
     * Méthode DELETE
     */
    async delete(endpoint, options = {}) {
        return this.request(endpoint, {
            method: 'DELETE',
            ...options
        });
    }

    /**
     * Upload de fichiers
     */
    async uploadFile(endpoint, file, fieldName = 'file', options = {}) {
        const formData = new FormData();
        formData.append(fieldName, file);

        // Ajout de données supplémentaires si nécessaire
        if (options.data) {
            Object.entries(options.data).forEach(([key, value]) => {
                formData.append(key, value);
            });
        }

        return this.request(endpoint, {
            method: 'POST',
            body: formData,
            headers: {
                // Supprimer Content-Type pour que le navigateur définisse
                // correctement le boundary pour FormData
                'Content-Type': undefined
            },
            ...options
        });
    }

    /**
     * Définir un intercepteur pour toutes les requêtes
     */
    setRequestInterceptor(interceptor) {
        this.requestInterceptor = interceptor;
        return this;
    }

    /**
     * Définir un intercepteur pour toutes les réponses
     */
    setResponseInterceptor(interceptor) {
        this.responseInterceptor = interceptor;
        return this;
    }

    /**
     * Gestionnaire de réponses API avec détection intelligente
     * @param {Object} apiResponse - La réponse complète de l'API
     * @returns {Object} Un objet standardisé avec le statut, le message et le type d'erreur
     */
    static handleApiResponse = (apiResponse) => {
        // Cas où la réponse est un succès
        if (apiResponse.status.code >= 200 && apiResponse.status.code < 300) {
            return {
                success: true,
                data: apiResponse.data,
                title: apiResponse.status.message || 'Opération réussie'
            };
        }

        // Gestion des erreurs
        const errors = apiResponse.errors || [];
        const firstError = errors.length > 0 ? errors[0] : null;

        return {
            success: false,
            statusCode: apiResponse.status.code,
            errorCode: firstError.code,
            title: firstError.title,
            detail: firstError ? firstError.detail : apiResponse.status.message,
            source: firstError.source
        };
    };
}

export default ApiClient;
