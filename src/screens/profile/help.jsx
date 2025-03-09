import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useToast } from '../../hooks/useToast';

const HelpPage = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const toast = useToast();

    const handleNotImplemented = () => {
        toast.info('Accès impossible', 'Fonctionnalité en cours de développement', {
            duration: 2500,
            position: toast.positions.TOP
        });
    };

    const renderHelpItem = (icon, title, description, last = false) => (
        <TouchableOpacity
            style={[styles.helpItem, !last ? { borderBottomWidth: 1, borderBottomColor: '#F0F0F0' } : null]}
            onPress={handleNotImplemented}
            activeOpacity={0.7}
        >
            <View style={styles.helpLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#4A6FE120' }]}>
                    <Ionicons name={icon} size={20} color="#4A6FE1" />
                </View>
                <View style={styles.helpTexts}>
                    <Text style={styles.helpTitle}>{title}</Text>
                    {description && <Text style={styles.helpDescription}>{description}</Text>}
                </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#A0A0A0" />
        </TouchableOpacity>
    );

    const renderFAQItem = (question, last = false) => (
        <TouchableOpacity
            style={[styles.faqItem, !last ? { borderBottomWidth: 1, borderBottomColor: '#F0F0F0' } : null]}
            onPress={handleNotImplemented}
            activeOpacity={0.7}
        >
            <View style={styles.faqQuestionContainer}>
                <Text style={styles.faqQuestion}>{question}</Text>
                <Ionicons name="chevron-down" size={18} color="#757575" />
            </View>
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
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Aide et Assistance</Text>
                    <View style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="transparent" />
                    </View>
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Search Bar */}
                <TouchableOpacity
                    style={styles.searchBar}
                    onPress={handleNotImplemented}
                    activeOpacity={0.8}
                >
                    <Ionicons name="search" size={20} color="#757575" />
                    <Text style={styles.searchText}>Rechercher dans l'aide</Text>
                </TouchableOpacity>

                {/* Help Options */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Comment pouvons-nous vous aider ?</Text>
                    <View style={styles.card}>
                        {renderHelpItem(
                            'book',
                            'Guides d\'utilisation',
                            'Apprenez à utiliser toutes les fonctionnalités'
                        )}
                        {renderHelpItem(
                            'videocam',
                            'Tutoriels vidéo',
                            'Vidéos explicatives pas à pas'
                        )}
                        {renderHelpItem(
                            'chatbubbles',
                            'Discuter avec le support',
                            'Assistance en temps réel'
                        )}
                        {renderHelpItem(
                            'cafe',
                            'Communauté',
                            'Posez vos questions à la communauté',
                            true
                        )}
                    </View>
                </View>

                {/* FAQ */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Questions fréquentes</Text>
                    <View style={styles.card}>
                        {renderFAQItem('Comment modifier mon profil ?')}
                        {renderFAQItem('Comment réinitialiser mon mot de passe ?')}
                        {renderFAQItem('Comment activer les notifications ?')}
                        {renderFAQItem('Puis-je utiliser l\'application hors ligne ?')}
                        {renderFAQItem('Comment contacter le support technique ?', true)}
                    </View>
                </View>

                {/* Topics */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Sujets populaires</Text>
                    <View style={styles.topicsContainer}>
                        <TouchableOpacity style={styles.topicButton} onPress={handleNotImplemented}>
                            <View style={styles.topicIcon}>
                                <Ionicons name="person" size={24} color="#4A6FE1" />
                            </View>
                            <Text style={styles.topicText}>Compte</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.topicButton} onPress={handleNotImplemented}>
                            <View style={styles.topicIcon}>
                                <Ionicons name="calendar" size={24} color="#4A6FE1" />
                            </View>
                            <Text style={styles.topicText}>Agenda</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.topicButton} onPress={handleNotImplemented}>
                            <View style={styles.topicIcon}>
                                <Ionicons name="document-text" size={24} color="#4A6FE1" />
                            </View>
                            <Text style={styles.topicText}>Documents</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.topicButton} onPress={handleNotImplemented}>
                            <View style={styles.topicIcon}>
                                <Ionicons name="shield-checkmark" size={24} color="#4A6FE1" />
                            </View>
                            <Text style={styles.topicText}>Sécurité</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Contact */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contacter le support</Text>
                    <View style={styles.card}>
                        <TouchableOpacity style={styles.contactButton} onPress={handleNotImplemented}>
                            <Ionicons name="mail" size={24} color="#FFFFFF" />
                            <Text style={styles.contactButtonText}>Par email</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.contactButton, styles.contactButtonSecondary]} onPress={handleNotImplemented}>
                            <Ionicons name="chatbubble-ellipses" size={24} color="#4A6FE1" />
                            <Text style={styles.contactButtonTextSecondary}>Par chat</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
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
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        marginTop: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    searchText: {
        color: '#757575',
        marginLeft: 10,
        fontSize: 14,
    },
    section: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 5,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    helpItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    helpLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 34,
        height: 34,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    helpTexts: {
        flex: 1,
    },
    helpTitle: {
        fontSize: 14,
        color: '#333333',
        fontWeight: '500',
    },
    helpDescription: {
        fontSize: 12,
        color: '#757575',
        marginTop: 2,
    },
    faqItem: {
        padding: 16,
    },
    faqQuestionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    faqQuestion: {
        fontSize: 14,
        color: '#333333',
        fontWeight: '500',
        flex: 1,
    },
    topicsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    topicButton: {
        width: '48%',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    topicIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#4A6FE120',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    topicText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333333',
    },
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4A6FE1',
        borderRadius: 12,
        padding: 15,
        marginVertical: 8,
        marginHorizontal: 10,
    },
    contactButtonSecondary: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#4A6FE1',
    },
    contactButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginLeft: 10,
    },
    contactButtonTextSecondary: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4A6FE1',
        marginLeft: 10,
    },
});

export default HelpPage;
