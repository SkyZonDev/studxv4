import React from 'react';
import { View, StyleSheet, Animated, Dimensions, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SCREEN } from '../styles/theme';
import Constants from 'expo-constants'

export default function LoadingScreen() {
    const version = Constants.expoConfig?.version || Constants.manifest?.version || 'non disponible';
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%', height: SCREEN.height, backgroundColor: '#fefefe', zIndex: 9999 }}>
            <Spinner />
            <Text style={{ position: 'absolute', bottom: 30, color: "#313131" }}>Developpé par Jean-Pierre Dupuis</Text>
            <Text style={{ position: 'absolute', bottom: 10, color: "#313131", fontSize: 11 }}>Version {version} </Text>
        </View>
    );
};


const Spinner = () => {
    // Création de la valeur d'animation
    const spinValue = new Animated.Value(0);

    // Animation de rotation
    React.useEffect(() => {
        Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 1700, // 1.7s comme dans le CSS original
                useNativeDriver: true,
            })
        ).start();
    }, []);

    // Interpolation pour la rotation
    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <Animated.View style={[styles.container, { transform: [{ rotate: spin }] }]}>
            <LinearGradient
                colors={['rgb(186, 66, 255)', 'rgb(0, 225, 255)']}
                style={styles.spinner}
                start={{ x: 0, y: 0.35 }}
                end={{ x: 0, y: 1 }}
            >
                <View style={styles.spinner1} />
            </LinearGradient>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    spinner: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        // Note: React Native ne supporte pas filter: blur directement
        // On utilise une ombre plus prononcée pour un effet similaire
        shadowColor: 'rgb(186, 66, 255)',
        shadowOffset: {
            width: 200,
            height: 50,
        },
        shadowOpacity: 0.8,
        shadowRadius: 20,
    },
    spinner1: {
        backgroundColor: '#fefefe',
        width: 85,
        height: 85,
        borderRadius: 50,
    },
});
