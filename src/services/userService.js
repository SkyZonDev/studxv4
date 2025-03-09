import ApiClient from './apiClient';


class UserService {
    constructor(baseUrl = 'https://studx.ddns.net/api/v1', options = {}) {
        this.apiClient = new ApiClient(baseUrl, options);
    }

    _cookieString(cookies) {
        const cookieList = [];
        for (const domain in cookies) {
            const cookieDict = cookies[domain];
            for (const name in cookieDict) {
                const value = cookieDict[name];
                cookieList.push(`${name}=${value}`);
            }
        }
        return cookieList.join('; ');
    }

    /**
     * Authentifie un utilisateur
     * @param {string} username - Nom d'utilisateur
     * @param {string} password - Mot de passe
     * @param {string|number} profileId - Identifiant du profil
     * @returns {Promise<Object>} - Données de l'utilisateur connecté
     */
    async login(username, password, profileId = "") {
        const response = await this.apiClient.post('/auth/login', {
            username,
            password,
            profileId
        });

        return response
    }

    /**
     * Récupère les données du calendrier de l'utilisateur
     * @param {string} path - Chemin du calendrier
     * @returns {Promise<Object>} - Données du calendrier
     */
    async getCalendar(path, cookies) {
        // const cString = this._cookieString(cookies);
        return this.apiClient.get({
            path: '/user/calendar',
            params: { path }
        }, {
            headers: {
                Cookie: cookies
            }
        });
    }

    /**
     * Récupère les clés du calendrier de l'utilisateur
     * @param {string} path - Chemin mydigitalcampus du calendrier
     * @param {string} cookies - Cookies de connexion
     * @returns {Promise<Object>} - Clés du calendrier
     */
    async getCalendarKey(path, cookies) {
        // const cString = this._cookieString(cookies);
        return this.apiClient.get({
            path: '/user/calendar-key',
            params: { path }
        }, {
            headers: {
                Cookie: cookies
            }
        });
    }

    /**
     * Récupère les données des absences de l'utilisateur
     * @param {string} path - Chemin mydigitalcampus des absences
     * @param {string} cookies - Cookies de connexion
     * @returns {Promise<Object>} - Absences
     */
    async getAbsences(path, cookies) {
        // const cString = this._cookieString(cookies);
        return this.apiClient.get({
            path: '/user/absences',
            params: { path }
        }, {
            headers: {
                Cookie: cookies
            }
        });
    }

    /**
     * Récupère les notes de l'utilisateur
     * @param {string} path - Chemin mydigitalcampus des absences
     * @param {string} cookies - Cookies de connexion
     * @returns {Promise<Object>} - Notes
     */
    async getGrades(path, cookies) {
        return this.apiClient.get({
            path: '/user/grades',
            params: { path }
        }, {
            headers: {
                Cookie: cookies
            }
        });
    }

    /**
     * @description Récupère la dernière version disponible de l'application
     */
    getUpdate() {
        return this.apiClient.get({
            path: '/app/releases/latest'
        })
    }

    /**
     * @description Récupère son identifiant unique
     */
    getUniqueID() {
        return this.apiClient.get({
            path: '/auth/uniqueID'
        });
    }

    isNewerVersion(version1, version2) {
        // Fonction pour extraire les numéros de version
        const extractNumbers = (version) => {
            return version.split(' ')[0].split('.').map(Number);
        };

        const v1 = extractNumbers(version1);
        const v2 = extractNumbers(version2);

        // Comparer chaque partie de la version
        for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
            const num1 = v1[i] || 0;
            const num2 = v2[i] || 0;

            if (num2 > num1) return true;
            if (num1 > num2) return false;
        }

        // Si toutes les parties sont égales, retourner false
        return false;
    }
}

export default UserService;
