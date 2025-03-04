import { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { useTheme } from '../context/themeContext';

const PREFERENCES_KEY = 'user_preferences';

export const usePreferences = () => {
    const { darkMode } = useTheme();
    const [preferences, setPreferences] = useState({
        theme: 'dark',
        notifications: false,
        appearance: darkMode ? "Sombre" : "Clair",
        language: "Français"
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        try {
            const storedPreferences = await StorageService.getData(PREFERENCES_KEY);
            if (storedPreferences) {
                setPreferences(storedPreferences);
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const savePreferences = async (newPreferences) => {
        try {
            await StorageService.saveData(PREFERENCES_KEY, newPreferences);
            setPreferences(newPreferences);
            return true;
        } catch (error) {
            console.error('Error saving preferences:', error);
            return false;
        }
    };

    const updatePreference = async (key, value) => {
        try {
            const newPreferences = {
                ...preferences,
                [key]: value
            };
            const success = await savePreferences(newPreferences);
            return success;
        } catch (error) {
            console.error('Error updating preference:', error);
            return false;
        }
    };

    return {
        preferences,
        isLoading,
        savePreferences,
        updatePreference
    };
};
