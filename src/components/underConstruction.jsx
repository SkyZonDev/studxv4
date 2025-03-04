import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { SCREEN } from '../styles/theme';
import LottieView from 'lottie-react-native';

const ConstructionPage = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.container}>
            {/* Header with Gradient */}
            <LinearGradient
                colors={['#4A6FE1', '#6C92F4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.header, { paddingTop: insets.top + 10 }]}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>En construction</Text>
                    <View style={{ width: 24 }} />
                </View>
            </LinearGradient>

            <View style={styles.content}>
                {/* Si vous avez Lottie, utilisez cette animation */}
                {/* Sinon, utilisez l'image statique ci-dessous */}
                {/* <LottieView
          source={require('../../assets/animations/construction.json')}
          autoPlay
          loop
          style={styles.animation}
        /> */}

                {/* Image statique (alternative à Lottie) */}
                <View style={styles.imageContainer}>
                    <Ionicons name="construct" size={120} color="#4A6FE1" />
                </View>

                <Text style={styles.title}>Page en construction</Text>
                <Text style={styles.description}>
                    Nous travaillons actuellement sur cette fonctionnalité pour vous offrir la meilleure expérience possible. Elle sera disponible très prochainement !
                </Text>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.buttonText}>Retour à l'accueil</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 15,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
    },
    animation: {
        width: 240,
        height: 240,
        marginBottom: 20,
    },
    imageContainer: {
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#E6EFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 24,
    },
    button: {
        backgroundColor: '#4A6FE1',
        paddingVertical: 14,
        paddingHorizontal: 40,
        borderRadius: 30,
        elevation: 3,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    }
});

export default ConstructionPage;
