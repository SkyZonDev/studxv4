// src/services/LogService.js
import * as FileSystem from 'expo-file-system';
import { Share } from 'react-native';

// Configuration du système de logs
const CONFIG = {
    RETENTION_DAYS: 7,
    LOG_PREFIX: 'app_log_',
    LOG_LEVELS: {
        DEBUG: 'DEBUG',
        INFO: 'INFO',
        WARN: 'WARN',
        ERROR: 'ERROR'
    },
    MAX_LOG_SIZE: 5 * 1024 * 1024, // 5 MB maximum par fichier de log
};

/**
 * Service principal de gestion des logs
 */
class LogService {
    constructor() {
        this.initialized = false;
        this.currentLogFile = null;
        this.logQueue = [];

        // Initialisation asynchrone
        this.init();
    }

    /**
     * Initialise le système de logs
     */
    async init() {
        try {
            // Création du dossier de logs s'il n'existe pas
            const logDir = `${FileSystem.documentDirectory}logs/`;
            const logDirInfo = await FileSystem.getInfoAsync(logDir);

            if (!logDirInfo.exists) {
                await FileSystem.makeDirectoryAsync(logDir, { intermediates: true });
            }

            // Définition du fichier de log courant (date du jour)
            const today = this._getFormattedDate(new Date());
            this.currentLogFile = `${logDir}${CONFIG.LOG_PREFIX}${today}.log`;

            // Rotation des logs anciens
            await this._rotateOldLogs(logDir);

            // Vider la file d'attente des logs si elle existe
            this._processLogQueue();

            this.initialized = true;
        } catch (error) {
            console.error('Erreur lors de l\'initialisation du système de logs:', error);
        }
    }

    /**
     * Ajoute un log de niveau DEBUG
     * @param {string} fileContext Nom du fichier source
     * @param {string} functionContext Nom de la fonction source
     * @param {string} message Message à logger
     * @param {object} data Données additionnelles (optionnel)
     */
    debug(fileContext, functionContext, message, data = null) {
        this._log(CONFIG.LOG_LEVELS.DEBUG, message, data, fileContext, functionContext);
    }

    /**
     * Ajoute un log de niveau INFO
     * @param {string} fileContext Nom du fichier source
     * @param {string} functionContext Nom de la fonction source
     * @param {string} message Message à logger
     * @param {object} data Données additionnelles (optionnel)
     */
    info(fileContext, functionContext, message, data = null) {
        this._log(CONFIG.LOG_LEVELS.INFO, message, data, fileContext, functionContext);
    }

    /**
     * Ajoute un log de niveau WARN
     * @param {string} fileContext Nom du fichier source
     * @param {string} functionContext Nom de la fonction source
     * @param {string} message Message à logger
     * @param {object} data Données additionnelles (optionnel)
     */
    warn(fileContext, functionContext, message, data = null) {
        this._log(CONFIG.LOG_LEVELS.WARN, message, data, fileContext, functionContext);
    }

    /**
     * Ajoute un log de niveau ERROR
     * @param {string} fileContext Nom du fichier source
     * @param {string} functionContext Nom de la fonction source
     * @param {string} message Message à logger
     * @param {object} data Données additionnelles (optionnel)
     */
    error(fileContext, functionContext, message, data = null) {
        this._log(CONFIG.LOG_LEVELS.ERROR, message, data, fileContext, functionContext);
    }

    /**
     * Fonction interne de gestion des logs
     * @param {string} level Niveau de log
     * @param {string} message Message à logger
     * @param {object} data Données additionnelles
     * @param {string} fileContext Nom du fichier source
     * @param {string} functionContext Nom de la fonction source
     * @private
     */
    _log(level, message, data, fileContext = 'unknown', functionContext = 'unknown') {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            fileContext,
            functionContext,
            message,
            data: data ? JSON.stringify(data) : null
        };

        // Formatage du log avec contexte
        const logString = `[${timestamp}][${level}][${fileContext}:${functionContext}] ${message}${data ? ` | ${JSON.stringify(data)}` : ''}\n`;

        // Si le service n'est pas encore initialisé, on met en file d'attente
        if (!this.initialized) {
            this.logQueue.push(logString);
            return;
        }

        // Écriture du log
        this._writeLog(logString);

        // Log également dans la console pour le développement
        this._consoleLog(level, message, data, fileContext, functionContext);
    }

    /**
     * Écrit un log dans le fichier courant
     * @param {string} logString Chaîne de log à écrire
     * @private
     */
    async _writeLog(logString) {
        try {
            // Vérifier si la date a changé (minuit passé)
            const today = this._getFormattedDate(new Date());
            const logDir = `${FileSystem.documentDirectory}logs/`;
            const expectedLogFile = `${logDir}${CONFIG.LOG_PREFIX}${today}.log`;

            if (this.currentLogFile !== expectedLogFile) {
                this.currentLogFile = expectedLogFile;
            }

            // Vérifier si le fichier existe déjà
            const fileInfo = await FileSystem.getInfoAsync(this.currentLogFile);

            if (fileInfo.exists) {
                // Lire le contenu existant
                const existingContent = await FileSystem.readAsStringAsync(this.currentLogFile);

                // Ajouter le nouveau log
                const newContent = existingContent + logString;

                // Écrire le contenu complet
                await FileSystem.writeAsStringAsync(
                    this.currentLogFile,
                    newContent,
                    { encoding: FileSystem.EncodingType.UTF8 }
                );
            } else {
                // Si le fichier n'existe pas, le créer avec le contenu initial
                await FileSystem.writeAsStringAsync(
                    this.currentLogFile,
                    logString,
                    { encoding: FileSystem.EncodingType.UTF8 }
                );
            }

        } catch (error) {
            console.error('Erreur lors de l\'écriture du log:', error);
            // Essai de secours
            try {
                const backupFile = `${FileSystem.documentDirectory}logs/backup_log.txt`;
                await FileSystem.writeAsStringAsync(
                    backupFile,
                    `ERREUR ÉCRITURE LOG: ${new Date().toISOString()} - ${logString}`,
                    { encoding: FileSystem.EncodingType.UTF8, append: true }
                );
            } catch (backupError) {
                console.error('Échec total du système de logs:', backupError);
            }
        }
    }

    /**
     * Affiche un log dans la console développeur
     * @param {string} level Niveau de log
     * @param {string} message Message à logger
     * @param {object} data Données additionnelles
     * @param {string} fileContext Nom du fichier source
     * @param {string} functionContext Nom de la fonction source
     * @private
     */
    _consoleLog(level, message, data, fileContext, functionContext) {
        const contextMsg = `[${fileContext}:${functionContext}] ${message}`;
        switch (level) {
            case CONFIG.LOG_LEVELS.DEBUG:
                console.debug(contextMsg, data || '');
                break;
            case CONFIG.LOG_LEVELS.INFO:
                console.info(contextMsg, data || '');
                break;
            case CONFIG.LOG_LEVELS.WARN:
                console.warn(contextMsg, data || '');
                break;
            case CONFIG.LOG_LEVELS.ERROR:
                console.error(contextMsg, data || '');
                break;
            default:
                console.log(contextMsg, data || '');
        }
    }

    /**
     * Traite la file d'attente des logs
     * @private
     */
    async _processLogQueue() {
        if (this.logQueue.length > 0 && this.initialized) {
            const queue = [...this.logQueue];
            this.logQueue = [];

            const combinedLogs = queue.join('');
            await this._writeLog(combinedLogs);
        }
    }

    /**
     * Effectue la rotation des logs (supprime les logs > 7 jours)
     * @param {string} logDir Dossier contenant les logs
     * @private
     */
    async _rotateOldLogs(logDir) {
        try {
            const files = await FileSystem.readDirectoryAsync(logDir);
            const logFiles = files.filter(file => file.startsWith(CONFIG.LOG_PREFIX));

            const today = new Date();
            const retentionDate = new Date(today);
            retentionDate.setDate(today.getDate() - CONFIG.RETENTION_DAYS);

            for (const file of logFiles) {
                try {
                    // Extraction de la date du nom de fichier
                    const dateStr = file.replace(CONFIG.LOG_PREFIX, '').replace('.log', '');
                    const [year, month, day] = dateStr.split('-').map(num => parseInt(num, 10));

                    // Création de la date à minuit pour une comparaison précise
                    const fileDate = new Date(year, month - 1, day);
                    fileDate.setHours(0, 0, 0, 0);
                    retentionDate.setHours(0, 0, 0, 0);

                    if (fileDate < retentionDate) {
                        // Suppression des logs plus anciens que la période de rétention
                        await FileSystem.deleteAsync(`${logDir}${file}`);
                        console.info(`Log ancien supprimé: ${file}`);
                    }
                } catch (error) {
                    console.error(`Erreur lors de l'analyse du fichier log ${file}:`, error);
                }
            }
        } catch (error) {
            console.error('Erreur lors de la rotation des logs:', error);
        }
    }


    /**
     * Formate une date au format YYYY-MM-DD
     * @param {Date} date Date à formater
     * @returns {string} Date formatée
     * @private
     */
    _getFormattedDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Récupère tous les logs disponibles
     * @returns {Promise<Array>} Tableau des fichiers de logs avec leur contenu
     */
    async getAllLogs() {
        try {
            const logDir = `${FileSystem.documentDirectory}logs/`;
            const dirExists = await FileSystem.getInfoAsync(logDir);

            if (!dirExists.exists) {
                console.warn('Le répertoire de logs n\'existe pas encore');
                return [];
            }

            const files = await FileSystem.readDirectoryAsync(logDir);
            const logFiles = files.filter(file => file.startsWith(CONFIG.LOG_PREFIX));

            // console.log(`Fichiers de logs trouvés: ${logFiles.length}`, logFiles);

            const logsContent = [];

            for (const file of logFiles) {
                try {
                    const filePath = `${logDir}${file}`;
                    const fileInfo = await FileSystem.getInfoAsync(filePath);

                    if (fileInfo.exists && fileInfo.size > 0) {
                        const fileContent = await FileSystem.readAsStringAsync(filePath);
                        logsContent.push({
                            filename: file,
                            content: fileContent,
                            size: fileInfo.size
                        });
                    } else {
                        console.warn(`Fichier de log vide ou inexistant: ${file}`);
                    }
                } catch (error) {
                    console.error(`Erreur lors de la lecture du fichier ${file}:`, error);
                }
            }

            return logsContent;
        } catch (error) {
            console.error('Erreur lors de la récupération des logs:', error);
            return [];
        }
    }

    /**
     * Récupère les logs d'une date spécifique
     * @param {Date} date Date des logs à récupérer
     * @returns {Promise<string>} Contenu des logs
     */
    async getLogsByDate(date) {
        try {
            const formattedDate = this._getFormattedDate(date);
            const logFile = `${FileSystem.documentDirectory}logs/${CONFIG.LOG_PREFIX}${formattedDate}.log`;

            const fileInfo = await FileSystem.getInfoAsync(logFile);

            if (!fileInfo.exists) {
                return null;
            }

            return await FileSystem.readAsStringAsync(logFile);
        } catch (error) {
            console.error('Erreur lors de la récupération des logs par date:', error);
            return null;
        }
    }

    /**
     * Exporte les logs au format ZIP pour partage
     */
    async exportLogs() {
        try {
            const logs = await this.getAllLogs();

            if (logs.length === 0) {
                console.warn('Aucun log à exporter');
                return false;
            }

            // Créer un fichier temporaire avec tous les logs concaténés
            const tempFile = `${FileSystem.cacheDirectory}all_logs.txt`;

            let content = "=== LOGS DE L'APPLICATION ===\n\n";
            for (const log of logs) {
                content += `=== ${log.filename} ===\n${log.content}\n\n`;
            }

            await FileSystem.writeAsStringAsync(tempFile, content);

            // Partage du fichier directement (sans compression ZIP)
            await Share.share({
                url: tempFile,
                title: 'Logs de l\'application'
            });

            // Suppression du fichier temporaire
            await FileSystem.deleteAsync(tempFile, { idempotent: true });

            return true;
        } catch (error) {
            console.error('Erreur lors de l\'export des logs:', error);
            return false;
        }
    }

    /**
     * Recherche dans les logs
     * @param {string} query Texte à rechercher
     * @param {Date} startDate Date de début (optionnel)
     * @param {Date} endDate Date de fin (optionnel)
     * @returns {Promise<Array>} Résultats de recherche
     */
    async searchLogs(query, startDate = null, endDate = null) {
        try {
            const logs = await this.getAllLogs();
            const results = [];

            for (const log of logs) {
                // Filtrage par date si nécessaire
                if (startDate || endDate) {
                    const dateStr = log.filename.replace(CONFIG.LOG_PREFIX, '').replace('.log', '');
                    const logDate = new Date(dateStr.replace(/-/g, '/'));

                    if (startDate && logDate < startDate) continue;
                    if (endDate && logDate > endDate) continue;
                }

                // Recherche dans le contenu
                const lines = log.content.split('\n');
                for (const line of lines) {
                    if (line.toLowerCase().includes(query.toLowerCase())) {
                        results.push({
                            file: log.filename,
                            line
                        });
                    }
                }
            }

            return results;
        } catch (error) {
            console.error('Erreur lors de la recherche dans les logs:', error);
            return [];
        }
    }

    /**
     * Supprime tous les fichiers de logs
     * @returns {Promise<boolean>} True si la suppression a réussi, False sinon
     */
    async clearAllLogs() {
        try {
            const logDir = `${FileSystem.documentDirectory}logs/`;
            const dirExists = await FileSystem.getInfoAsync(logDir);

            if (!dirExists.exists) {
                console.warn('Le répertoire de logs n\'existe pas');
                return true;
            }

            const files = await FileSystem.readDirectoryAsync(logDir);
            const logFiles = files.filter(file => file.startsWith(CONFIG.LOG_PREFIX));

            for (const file of logFiles) {
                try {
                    await FileSystem.deleteAsync(`${logDir}${file}`);
                } catch (error) {
                    console.error(`Erreur lors de la suppression du fichier ${file}:`, error);
                    return false;
                }
            }

            return true;
        } catch (error) {
            console.error('Erreur lors de la suppression des logs:', error);
            return false;
        }
    }
}

// Export d'une instance singleton
const logger = new LogService();
export default logger;
