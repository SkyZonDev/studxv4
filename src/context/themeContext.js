import { COLORS } from '../styles/theme';
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();
const THEME_PREFERENCE_KEY = '@theme_mode';

export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        loadThemePreference();
    }, []);

    const loadThemePreference = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
            setIsDarkMode(savedTheme === 'dark');
        } catch (error) {
            console.error('Error loading theme preference:', error);
            setIsDarkMode(false);
        }
    };

    const toggleTheme = async () => {
        const newTheme = !isDarkMode;
        setIsDarkMode(newTheme);
        try {
            await AsyncStorage.setItem(THEME_PREFERENCE_KEY, newTheme ? 'dark' : 'light');
        } catch (error) {
            console.error('Error saving theme preference:', error);
        }
    };

    const colors = isDarkMode ? COLORS['dark'] : COLORS['light']

    if (isDarkMode === null) {
        return false; // or a loading spinner
    }

    return (
        <ThemeContext.Provider value={{ isDarkMode, colors, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
