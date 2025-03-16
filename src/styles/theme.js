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
        background: '#F5F7FA',
        surface: '#FFFFFF',
        border: '#E2E8F0',
        text: {
            primary: '#2D3142',
            secondary: '#666666',
            tertiary: '#757575',
            muted: '#A0A0A0',
            inverse: '#FFFFFF'
        },
        // Couleurs principales
        primary: {
            main: '#4A6FE1',
            light: '#6C92F4',
            lighter: '#E0E8FF',
            background: '#F0F4FF',
            contrast: '#FFFFFF'
        },
        // États et accents
        success: {
            main: '#66BB6A',
            light: '#66BB6A20',
            text: '#66BB6A'
        },
        warning: {
            main: '#FFB74D',
            light: '#FFB74D20',
            text: '#FFB74D'
        },
        error: {
            main: '#FF8A65',
            light: '#FF8A6520',
            text: '#FF8A65'
        },
        info: {
            main: '#4A6FE1',
            light: '#4A6FE110',
            border: '#4A6FE130',
            text: '#4A6FE1'
        },
        // Éléments spécifiques
        card: {
            background: '#FFFFFF',
            shadow: 'rgba(0, 0, 0, 0.1)',
            border: '#E2E8F0'
        },
        course: {
            currentBadge: {
                background: '#4A6FE110',
                border: '#4A6FE130',
                text: '#4A6FE1'
            },
            info: {
                background: '#E8F9FB',
                text: '#666666'
            }
        },
        // Dégradés
        gradients: {
            primary: ['#4A6FE1', '#6C92F4']
        }
    },
    dark: {
        // Couleurs de base
        background: '#121826',
        surface: '#1E293B',
        border: '#334155',
        text: {
            primary: '#F1F5F9',
            secondary: '#CBD5E1',
            tertiary: '#94A3B8',
            muted: '#64748B',
            inverse: '#1E293B'
        },
        // Couleurs principales
        primary: {
            main: '#60A5FA',
            light: '#93C5FD',
            lighter: '#1E3A8A',
            background: '#1E3A8A50',
            contrast: '#F1F5F9'
        },
        // États et accents
        success: {
            main: '#4ADE80',
            light: '#4ADE8020',
            text: '#4ADE80'
        },
        warning: {
            main: '#FBBF24',
            light: '#FBBF2420',
            text: '#FBBF24'
        },
        error: {
            main: '#F87171',
            light: '#F8717120',
            text: '#F87171'
        },
        info: {
            main: '#60A5FA',
            light: '#60A5FA10',
            border: '#60A5FA30',
            text: '#60A5FA'
        },
        // Éléments spécifiques
        card: {
            background: '#1E293B',
            shadow: 'rgba(0, 0, 0, 0.25)',
            border: '#334155'
        },
        course: {
            currentBadge: {
                background: '#60A5FA10',
                border: '#60A5FA30',
                text: '#60A5FA'
            },
            info: {
                background: '#0F172A',
                text: '#CBD5E1'
            }
        },
        // Dégradés
        gradients: {
            primary: ['#1A2F61', '#2C4A8A']
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
