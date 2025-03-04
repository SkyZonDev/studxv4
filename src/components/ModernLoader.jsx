import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

const ModernLoader = ({ title }) => {
    // Animation pour la rotation
    const spinValue = useRef(new Animated.Value(0)).current;

    // Animation pour l'opacité du texte
    const textOpacity = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        // Animation de rotation continue
        Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 1500,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        // Animation de pulsation du texte
        Animated.loop(
            Animated.sequence([
                Animated.timing(textOpacity, {
                    toValue: 1,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(textOpacity, {
                    toValue: 0.5,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                })
            ])
        ).start();
    }, []);

    // Interpolation pour la rotation
    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            <View style={styles.loaderWrapper}>
                <Animated.View
                    style={[
                        styles.spinner,
                        { transform: [{ rotate: spin }] }
                    ]}
                />
                <Animated.Text
                    style={[
                        styles.loaderText,
                        { opacity: textOpacity }
                    ]}
                >
                    {title}
                </Animated.Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f7f7f7',
    },
    loaderWrapper: {
        alignItems: 'center',
        padding: 20,
    },
    spinner: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 3,
        borderBottomColor: '#e0e0e0',
        borderLeftColor: '#e0e0e0',
        borderRightColor: '#e0e0e0',
        borderTopColor: '#4A6FE1',
        marginBottom: 20,
    },
    loaderText: {
        fontSize: 16,
        color: '#555',
        fontWeight: '500',
        letterSpacing: 0.5,
    },
});

export default ModernLoader;
