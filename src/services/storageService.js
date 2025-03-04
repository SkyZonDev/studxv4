// storageService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export class StorageService {
    static async saveData(key, data) {
        try {
            const jsonValue = JSON.stringify({
                data,
                timestamp: new Date().toISOString()
            });
            await AsyncStorage.setItem(key, jsonValue);
            return true;
        } catch (error) {
            console.error(`Error saving data for key ${key}:`, error);
            return false;
        }
    }

    static async getData(key, expirationHours = null) {
        try {
            const jsonValue = await AsyncStorage.getItem(key);
            if (!jsonValue) return null;

            const storedData = JSON.parse(jsonValue);

            if (expirationHours) {
                const storedDate = new Date(storedData.timestamp);
                const currentDate = new Date();
                const hoursDifference = (currentDate - storedDate) / (1000 * 60 * 60);

                if (hoursDifference > expirationHours) {
                    await this.removeData(key);
                    return null;
                }
            }

            return storedData.data;
        } catch (error) {
            console.error(`Error getting data for key ${key}:`, error);
            return null;
        }
    }

    static async removeData(key) {
        try {
            await AsyncStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error removing data for key ${key}:`, error);
            return false;
        }
    }

    static async removeMultipleData(keys) {
        try {
            await AsyncStorage.multiRemove(keys);
            return true;
        } catch (error) {
            console.error('Error removing multiple keys:', error);
            return false;
        }
    }

    static async clearAll() {
        try {
            await AsyncStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing all data:', error);
            return false;
        }
    }
}
