import { StyleSheet, Dimensions } from 'react-native';
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');


// Définition des couleurs
export const COLORS = {
    state: {
        success: '#28a745',
        error: '#EF4444',
        warning: '#ffc107',
        info: '#17a2b8',
    },
    light: {
        // Couleurs de base
        background: '#ffffff',
        surface: '#e1e1e1',
        border: '#E2E8F0',
        text: {
            primary: '#1E293B',
            secondary: '#64748B',
            muted: '#94A3B8',
            inverse: '#FFFFFF'
        },
        // Couleurs principales et états
        primary: {
            main: '#4F46E5',
            light: '#EEF2FF',
            dark: '#4338CA',
            contrast: '#FFFFFF'
        },
        hover: {
            surface: '#F1F5F9',
            primary: '#4338CA'
        },
        // Couleurs sémantiques
        success: {
            main: '#10B981',
            light: '#D1FAE5',
            dark: '#059669'
        },
        error: {
            main: '#EF4444',
            light: '#FEE2E2',
            dark: '#DC2626'
        },
        warning: {
            main: '#F59E0B',
            light: '#FEF3C7',
            dark: '#D97706'
        },
        info: {
            main: '#3B82F6',
            light: '#DBEAFE',
            dark: '#2563EB'
        },
        // Couleurs pour les cartes et éléments spécifiques
        card: {
            background: '#FFFFFF',
            shadow: 'rgba(0, 0, 0, 0.1)',
            border: '#E2E8F0'
        },
        // Dégradés pour les cartes de cours
        gradients: {
            blue: ['#4F46E5', '#818CF8'],
            purple: ['#7C3AED', '#A78BFA'],
            indigo: ['#6366F1', '#3730A3']
            // indigo:  ['#3730A3', '#6366F1']
        }
    },
    dark: {
        // Couleurs de base
        background: '#010101',
        surface: '#212121', //'#1E293B',
        border: '#334155',
        text: {
            primary: '#F8FAFC',
            secondary: '#CBD5E1',
            muted: '#94A3B8',
            inverse: '#1E293B'
        },
        // Couleurs principales et états
        primary: {
            main: '#818CF8',
            light: '#312E81',
            dark: '#A5B4FC',
            contrast: '#1E293B'
        },
        hover: {
            surface: '#334155',
            primary: '#A5B4FC'
        },
        // Couleurs sémantiques
        success: {
            main: '#34D399',
            light: '#064E3B',
            dark: '#6EE7B7'
        },
        error: {
            main: '#F87171',
            light: '#7F1D1D',
            dark: '#FCA5A5'
        },
        warning: {
            main: '#FBBF24',
            light: '#78350F',
            dark: '#FCD34D'
        },
        info: {
            main: '#60A5FA',
            light: '#1E3A8A',
            dark: '#93C5FD'
        },
        // Couleurs pour les cartes et éléments spécifiques
        card: {
            background: '#1E293B',
            shadow: 'rgba(0, 0, 0, 0.3)',
            border: '#334155'
        },
        // Dégradés pour les cartes de cours
        gradients: {
            blue: ['#818CF8', '#4F46E5'],
            purple: ['#A78BFA', '#7C3AED'],
            indigo: ['#6366F1', '#3730A3']
        }
    }
};

// Définition des espaces (margin, padding)
export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
};

// Définition des tailles de police
export const FONT_SIZES = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
};

export const SCREEN = {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT
}

// Styles globaux réutilisables
export const globalStyles = StyleSheet.create({
    // Conteneurs
    container: {
        flex: 1,
        minHeight: SCREEN_HEIGHT,
        paddingBottom: 20
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    card: {
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },

    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    mt: { marginTop: SPACING.md },
    mb: { marginBottom: SPACING.md },
    mv: { marginVertical: SPACING.md },
    mh: { marginHorizontal: SPACING.md },
});
