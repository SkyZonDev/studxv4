import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/themeContext';
import { useNavigation } from '@react-navigation/native';

const TermsOfServiceScreen = () => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: insets.top + 10,
            paddingBottom: 15,
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        backButton: {
            padding: 8,
        },
        title: {
            fontSize: 20,
            fontWeight: 'bold',
            color: colors.text.primary,
            marginLeft: 12,
        },
        content: {
            flex: 1,
            padding: 20,
        },
        section: {
            marginBottom: 24,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: colors.text.primary,
            marginBottom: 12,
        },
        paragraph: {
            fontSize: 15,
            lineHeight: 22,
            color: colors.text.secondary,
            marginBottom: 12,
        },
        bulletPoint: {
            flexDirection: 'row',
            marginBottom: 8,
            paddingLeft: 8,
        },
        bullet: {
            fontSize: 15,
            color: colors.primary.main,
            marginRight: 8,
            marginTop: 3,
        },
        bulletText: {
            fontSize: 15,
            lineHeight: 22,
            color: colors.text.secondary,
            flex: 1,
        },
        boldText: {
            fontWeight: '600',
            color: colors.text.primary,
        },
        lastUpdated: {
            fontSize: 13,
            color: colors.text.tertiary,
            textAlign: 'center',
            marginTop: 24,
            marginBottom: 16,
        },
        contactSection: {
            backgroundColor: colors.primary.background,
            borderRadius: 12,
            padding: 16,
            marginTop: 8,
            marginBottom: 24,
        },
        contactTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.primary.main,
            marginBottom: 8,
        },
        contactText: {
            fontSize: 14,
            lineHeight: 20,
            marginBottom: 10,
            color: colors.text.secondary,
        },
        contactEmail: {
            color: colors.primary.main,
            fontWeight: '500',
            textAlign: "center"
        },
    });

    const renderBulletPoint = (text) => (
        <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>{text}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Conditions d'utilisation</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <Text style={styles.paragraph}>
                        Bienvenue sur notre StudX, notre application mobile dédiée à la consultation de vos notes, emploi du temps et absences.
                        En utilisant cette application, vous acceptez les présentes conditions d'utilisation. Veuillez les lire
                        attentivement avant d'utiliser l'application.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. Acceptation des conditions</Text>
                    <Text style={styles.paragraph}>
                        En téléchargeant, installant ou utilisant cette application, vous acceptez d'être lié par ces conditions
                        d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser l'application.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. Description du service</Text>
                    <Text style={styles.paragraph}>
                        Notre application fournit un accès aux informations concernant votre scolarité, incluant mais non limité à :
                    </Text>
                    {renderBulletPoint("La consultation de votre emploi du temps")}
                    {renderBulletPoint("La visualisation de vos notes et résultats académiques")}
                    {renderBulletPoint("Le suivi de vos absences et retards")}
                    <Text style={styles.paragraph}>
                        Ces données sont synchronisées avec les systèmes d'information de votre établissement. Nous ne pouvons
                        garantir l'exactitude des informations qui dépendent des systèmes tiers.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>3. Compte utilisateur</Text>
                    <Text style={styles.paragraph}>
                        Pour accéder aux services, vous devez posséder un compte Mydigitalcampus valide. Vous êtes responsable
                        de maintenir la confidentialité de vos identifiants et de toutes les activités qui se produisent sous votre compte.
                    </Text>
                    <Text style={styles.paragraph}>
                        Vous acceptez de :
                    </Text>
                    {renderBulletPoint("Ne pas partager vos identifiants avec des tiers")}
                    {renderBulletPoint("Nous informer immédiatement de toute utilisation non autorisée de votre compte")}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>4. Confidentialité des données</Text>
                    <Text style={styles.paragraph}>
                        La protection de vos données personnelles est primordiale. Notre application ne stocke aucune donnée utilisateur sur
                        des serveurs externes. Toutes les informations, y compris vos identifiants, emploi du temps, notes, absences et cookies
                        de session Mydigitalcampus, sont exclusivement conservées en local sur votre appareil.
                    </Text>
                    <Text style={styles.paragraph}>
                        En utilisant l'application, vous acceptez que vos données soient utilisées uniquement pour fournir les services proposés,
                        sans transmission à des tiers. Vous restez entièrement maître de vos informations, et celles-ci ne sont accessibles que
                        depuis votre appareil.
                    </Text>
                </View>


                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>5. Propriété intellectuelle</Text>
                    <Text style={styles.paragraph}>
                        L'application, y compris son contenu, ses fonctionnalités et son interface, est protégée par des droits d'auteur,
                        des marques de commerce et d'autres lois sur la propriété intellectuelle.
                    </Text>
                    <Text style={styles.paragraph}>
                        Vous n'êtes pas autorisé à :
                    </Text>
                    {renderBulletPoint("Copier, modifier ou distribuer l'application ou son contenu")}
                    {renderBulletPoint("Décompiler, désassembler ou tenter d'accéder au code source")}
                    {renderBulletPoint("Supprimer ou modifier les identifications de l'application")}
                    {renderBulletPoint("Utiliser l'application à des fins commerciales sans autorisation")}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>6. Limitations d'utilisation</Text>
                    <Text style={styles.paragraph}>
                        Vous acceptez de ne pas utiliser l'application pour :
                    </Text>
                    {renderBulletPoint("Violer des lois ou règlements applicables")}
                    {renderBulletPoint("Transmettre du contenu illégal, offensant ou nuisible")}
                    {renderBulletPoint("Tenter d'accéder aux comptes d'autres utilisateurs")}
                    {renderBulletPoint("Interférer avec le fonctionnement normal de l'application")}
                    {renderBulletPoint("Collecter des données personnelles d'autres utilisateurs")}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>7. Disponibilité et mises à jour</Text>
                    <Text style={styles.paragraph}>
                        Nous nous efforçons de maintenir l'application disponible et à jour, mais nous ne pouvons garantir que
                        l'application sera accessible sans interruption. Des mises à jour pourront être déployées périodiquement
                        pour améliorer les fonctionnalités ou corriger des problèmes.
                    </Text>
                    <Text style={styles.paragraph}>
                        En utilisant l'application, vous acceptez de recevoir des mises à jour automatiques lorsqu'elles sont disponibles.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>8. Limitation de responsabilité</Text>
                    <Text style={styles.paragraph}>
                        Dans les limites autorisées par la loi, nous ne sommes pas responsables des dommages directs, indirects,
                        accessoires, spéciaux ou consécutifs résultant de l'utilisation ou de l'impossibilité d'utiliser l'application.
                    </Text>
                    <Text style={styles.paragraph}>
                        L'application est fournie "telle quelle" et "selon disponibilité" sans garanties d'aucune sorte,
                        explicites ou implicites.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>9. Résiliation</Text>
                    <Text style={styles.paragraph}>
                        Nous nous réservons le droit de suspendre ou de résilier votre accès à l'application à tout moment,
                        avec ou sans préavis, pour tout motif raisonnable, y compris, sans limitation, une violation des
                        présentes conditions d'utilisation.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>10. Modifications des conditions</Text>
                    <Text style={styles.paragraph}>
                        Nous pouvons modifier ces conditions d'utilisation à tout moment. Les modifications prendront effet
                        dès leur publication dans l'application. L'utilisation continue de l'application après la publication
                        des modifications constitue votre acceptation de ces modifications.
                    </Text>
                </View>

                <View style={styles.contactSection}>
                    <Text style={styles.contactTitle}>Nous contacter</Text>
                    <Text style={styles.contactText}>
                        Si vous avez des questions concernant ces conditions d'utilisation, veuillez nous contacter à l'adresse :
                    </Text>
                    <Text style={styles.contactEmail}> studx.esme@gmail.com</Text>
                </View>

                <Text style={styles.lastUpdated}>Dernière mise à jour : 16 mars 2025</Text>
                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

export default TermsOfServiceScreen;
