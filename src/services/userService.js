import ApiClient from './apiClient';

class UserService {
    constructor(baseUrl = 'https://studx.ddns.net/api/v1', options = {}) {
        this.apiClient = new ApiClient(baseUrl, options);
    }

    /**
     * Authentifie un utilisateur
     * @param {string} username - Nom d'utilisateur
     * @param {string} password - Mot de passe
     * @param {string|number} profileId - Identifiant du profil
     * @returns {Promise<Object>} - Données de l'utilisateur connecté
     */
    async login(username, password, profileId = "") {
        const response = await this.apiClient.post('/login', {
            username,
            password,
            profileId
        });
        return response.data
    }

    /**
     * Récupère les données du calendrier de l'utilisateur
     * @param {string} path - Chemin du calendrier
     * @returns {Promise<Object>} - Données du calendrier
     */
    async getCalendar(path) {
        return this.apiClient.get({
            path: '/user/calendar',
            params: { path }
        });
    }

    /**
     * Récupère les clés du calendrier de l'utilisateur
     * @param {string} path - Chemin mydigitalcampus du calendrier
     * @param {string} cookies - Cookies de connexion
     * @returns {Promise<Object>} - Clés du calendrier
     */
    async getCalendarKey(path, cookies) {
        return this.apiClient.post('/user/calendar-key', {
            path,
            cookies
        });
    }

    /**
     * Récupère les données du calendrier de l'utilisateur
     * @param {string} path - Chemin mydigitalcampus des absences
     * @param {string} cookies - Cookies de connexion
     * @returns {Promise<Object>} - Données du calendrier
     */
    async getAbsences(path, cookies) {
        const response = await this.apiClient.post('/user/absences', {
            path,
            cookies
        });
        return response.data
    }
}

export default UserService;
