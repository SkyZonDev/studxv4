import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    StatusBar,
    TextInput,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useToast } from '../hooks/useToast';

const SupportPage = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const toast = useToast();

    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);

    const categories = [
        { id: 1, name: "Problème technique", icon: "construct" },
        { id: 2, name: "Compte", icon: "person" },
        { id: 3, name: "Paiement", icon: "card" },
        { id: 4, name: "Autre", icon: "help-circle" }
    ];

    const handleSubmit = () => {
        if (!selectedCategory) {
            toast.error('Veuillez sélectionner une catégorie', {
                duration: 2500,
                position: toast.positions.TOP
            });
            return;
        }

        if (!subject.trim()) {
            toast.error('Veuillez indiquer un sujet', {
                duration: 2500,
                position: toast.positions.TOP
            });
            return;
        }

        if (!message.trim()) {
            toast.error('Veuillez saisir un message', {
                duration: 2500,
                position: toast.positions.TOP
            });
            return;
        }

        // Simuler l'envoi d'une demande
        toast.success('Votre demande a été envoyée', {
            duration: 3000,
            position: toast.positions.TOP
        });

        // Reset form
        setSubject('');
        setMessage('');
        setSelectedCategory(null);

        // Navigate back after a delay
        setTimeout(() => navigation.back(), 2000);
    };

    const renderCategoryItem = (category) => (
        <TouchableOpacity
            key={category.id}
            style={[
                styles.categoryItem,
                selectedCategory?.id === category.id && styles.selectedCategoryItem
            ]}
            onPress={() => setSelectedCategory(category)}
        >
            <View style={[
                styles.categoryIcon,
                selectedCategory?.id === category.id
                    ? { backgroundColor: '#4A6FE1' }
                    : { backgroundColor: '#4A6FE120' }
            ]}>
                <Ionicons
                    name={category.icon}
                    size={22}
                    color={selectedCategory?.id === category.id ? "#FFFFFF" : "#4A6FE1"}
                />
            </View>
            <Text style={[
                styles.categoryName,
                selectedCategory?.id === category.id && styles.selectedCategoryName
            ]}>
                {category.name}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

            {/* Header with Gradient */}
            <LinearGradient
                colors={['#4A6FE1', '#6C92F4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.header, { paddingTop: insets.top + 10 }]}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.navigate('profile')} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Contacter le support</Text>
                    <View style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="transparent" />
                    </View>
                </View>
            </LinearGradient>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Introduction */}
                    <View style={styles.introContainer}>
                        <Text style={styles.introTitle}>Comment pouvons-nous vous aider ?</Text>
                        <Text style={styles.introText}>
                            Notre équipe de support est là pour vous aider. Veuillez remplir le formulaire ci-dessous et nous vous répondrons dans les plus brefs délais.
                        </Text>
                    </View>

                    {/* Categories */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Catégorie</Text>
                        <View style={styles.categoriesContainer}>
                            {categories.map(renderCategoryItem)}
                        </View>
                    </View>

                    {/* Contact Form */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Détails</Text>
                        <View style={styles.card}>
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Sujet</Text>
                                <TextInput
                                    style={styles.input}
                                    value={subject}
                                    onChangeText={setSubject}
                                    placeholder="Ex: Problème de connexion"
                                    placeholderTextColor="#AAAAAA"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Votre message</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={message}
                                    onChangeText={setMessage}
                                    placeholder="Décrivez votre problème en détail..."
                                    placeholderTextColor="#AAAAAA"
                                    multiline={true}
                                    numberOfLines={6}
                                    textAlignVertical="top"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleSubmit}
                    >
                        <Text style={styles.submitButtonText}>Envoyer ma demande</Text>
                    </TouchableOpacity>

                    {/* Alternative Contact Methods */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Autres moyens de contact</Text>
                        <View style={styles.card}>
                            <View style={styles.contactMethod}>
                                <View style={styles.contactIcon}>
                                    <Ionicons name="chatbubbles" size={20} color="#4A6FE1" />
                                </View>
                                <View style={styles.contactDetails}>
                                    <Text style={styles.contactTitle}>Chat en direct</Text>
                                    <Text style={styles.contactInfo}>Lun-Ven : 9h-18h</Text>
                                </View>
                                <TouchableOpacity style={styles.contactButton}>
                                    <Text style={styles.contactButtonText}>Démarrer</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={[styles.contactMethod, { borderBottomWidth: 0 }]}>
                                <View style={styles.contactIcon}>
                                    <Ionicons name="mail" size={20} color="#4A6FE1" />
                                </View>
                                <View style={styles.contactDetails}>
                                    <Text style={styles.contactTitle}>Email</Text>
                                    <Text style={styles.contactInfo}>support@studx.fr</Text>
                                </View>
                                <TouchableOpacity style={styles.contactButton}>
                                    <Text style={styles.contactButtonText}>Copier</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <View style={{ height: 100 }} />
                </ScrollView>
            </KeyboardAvoidingView>
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
        paddingTop: 15,
        paddingBottom: 25,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    introContainer: {
        marginTop: 24,
        marginBottom: 10,
    },
    introTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 8,
    },
    introText: {
        fontSize: 14,
        color: '#666666',
        lineHeight: 20,
    },
    section: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    categoriesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    categoryItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        marginBottom: 15,
        width: '48%',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    selectedCategoryItem: {
        backgroundColor: '#EBF1FF',
        borderWidth: 1,
        borderColor: '#4A6FE1',
    },
    categoryIcon: {
        width: 46,
        height: 46,
        borderRadius: 23,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333333',
    },
    selectedCategoryName: {
        color: '#4A6FE1',
        fontWeight: '600',
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F5F7FA',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#333333',
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    textArea: {
        height: 120,
        paddingTop: 12,
    },
    submitButton: {
        backgroundColor: '#4A6FE1',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 24,
        elevation: 2,
        shadowColor: '#4A6FE1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    contactMethod: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    contactIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#4A6FE120',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    contactDetails: {
        flex: 1,
    },
    contactTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333333',
    },
    contactInfo: {
        fontSize: 12,
        color: '#757575',
        marginTop: 2,
    },
    contactButton: {
        backgroundColor: '#4A6FE120',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    contactButtonText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#4A6FE1',
    },
});

export default SupportPage;
