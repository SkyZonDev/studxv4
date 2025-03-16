import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    StatusBar,
    TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/themeContext';
import { useNavigation } from '@react-navigation/native';

const PrivacyPolicyScreen = () => {
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
            marginRight: 16,
        },
        headerTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: colors.text.primary,
        },
        content: {
            flex: 1,
            paddingHorizontal: 20,
            paddingTop: 16,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: colors.text.primary,
            marginTop: 24,
            marginBottom: 12,
        },
        paragraph: {
            fontSize: 15,
            lineHeight: 22,
            color: colors.text.secondary,
            marginBottom: 16,
        },
        bullet: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            marginBottom: 8,
            paddingLeft: 8,
        },
        bulletDot: {
            fontSize: 15,
            marginRight: 8,
            color: colors.primary.main,
            fontWeight: 'bold',
            lineHeight: 22,
        },
        bulletText: {
            fontSize: 15,
            lineHeight: 22,
            flex: 1,
            color: colors.text.secondary,
        },
        lastUpdated: {
            fontSize: 13,
            color: colors.text.tertiary,
            marginTop: 30,
            marginBottom: 40,
            textAlign: 'center',
            fontStyle: 'italic',
        },
        contactLink: {
            color: colors.primary.main,
            textDecorationLine: 'underline',
        },
    });

    const renderBullet = (text) => {
        return (
            <View style={styles.bullet}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{text}</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Politique de confidentialité</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.paragraph}>
                    Bienvenue dans notre politique de confidentialité. Votre vie privée est essentielle pour nous. Cette politique explique comment nous stockons et protégeons vos informations lorsque vous utilisez notre application.
                </Text>

                <Text style={styles.sectionTitle}>Informations que nous stockons</Text>
                {renderBullet("Informations personnelles : Votre nom, prénom, adresse e-mail et photo de profil si vous choisissez d'en ajouter une.")}
                {renderBullet("Informations académiques : Vos notes, absences et emploi du temps fournis par votre établissement scolaire.")}
                {renderBullet("Données de session : Cookies de session Mydigitalcampus nécessaires pour récupérer vos informations académiques.")}
                {renderBullet("Informations d'appareil : Préférences d'application comme le thème.")}

                <Text style={styles.sectionTitle}>Comment nous utilisons vos informations</Text>
                {renderBullet("Pour vous fournir un accès à vos données académiques, incluant vos notes, absences et emploi du temps.")}
                {renderBullet("Pour personnaliser votre expérience utilisateur, comme l'affichage de votre nom et prénom dans l'application.")}
                {renderBullet("Pour vous envoyer des notifications concernant vos cours, notes ou absences si vous avez activé cette option.")}

                <Text style={styles.sectionTitle}>Stockage et sécurité des données</Text>
                <Text style={styles.paragraph}>
                    Toutes vos informations sont stockées uniquement en local sur votre appareil. Aucune donnée n'est transmise à des serveurs externes ou à des tiers. Vous avez un contrôle total sur vos informations, et elles sont supprimées dès que vous désinstallez l'application.
                </Text>

                <Text style={styles.sectionTitle}>Conservation des données</Text>
                <Text style={styles.paragraph}>
                    Toutes vos données sont stockées uniquement en local sur votre appareil. Nous ne conservons aucune information sur des serveurs externes. Vous pouvez à tout moment supprimer vos données en désinstallant l'application.
                </Text>

                <Text style={styles.sectionTitle}>Vos droits</Text>
                <Text style={styles.paragraph}>
                    Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants concernant vos données personnelles :
                </Text>
                {renderBullet("Droit d'accès à vos données personnelles stockées sur votre appareil")}
                {renderBullet("Droit de rectification des données inexactes directement depuis l'application")}
                {renderBullet("Droit à l'effacement de vos données en désinstallant l'application")}
                {renderBullet("Droit à la limitation du traitement des données, celles-ci n'étant utilisées que pour le fonctionnement de l'application")}
                {renderBullet("Droit à la portabilité de vos données, celles-ci étant stockées exclusivement sur votre appareil")}
                {renderBullet("Droit d'opposition au traitement des données, celles-ci n'étant ni transmises ni partagées")}

                <Text style={styles.sectionTitle}>Cookies et technologies similaires</Text>
                <Text style={styles.paragraph}>
                    Notre application utilise uniquement le stockage local de votre appareil pour conserver vos préférences et vous permettre de rester connecté. Aucun suivi ou collecte de données via des serveurs distants n'est effectué. Vous pouvez à tout moment effacer ces données dans les paramètres de l'application.
                </Text>

                <Text style={styles.sectionTitle}>Mineurs</Text>
                <Text style={styles.paragraph}>
                    Cette application est destinée aux étudiants, qui peuvent être mineurs. Pour les utilisateurs de moins de 16 ans, l'utilisation de l'application requiert le consentement d'un parent ou tuteur légal. Nous ne collectons ni ne stockons de données sur des serveurs externes, garantissant ainsi une protection renforcée des informations des utilisateurs mineurs.
                </Text>

                <Text style={styles.sectionTitle}>Modifications de notre politique de confidentialité</Text>
                <Text style={styles.paragraph}>
                    Cette politique de confidentialité peut être mise à jour occasionnellement. Toute modification sera affichée directement dans l'application. Puisque nous ne collectons pas vos informations, nous ne vous contacterons pas par e-mail pour ces mises à jour.
                </Text>

                <Text style={styles.sectionTitle}>Nous contacter</Text>
                <Text style={styles.paragraph}>
                    Si vous avez des questions concernant cette politique de confidentialité, vous pouvez nous contacter à <Text style={styles.contactLink}>studx.esme@gmail.com</Text> ou via la section "Contactez le support" de l'application.
                </Text>


                <Text style={styles.lastUpdated}>
                    Dernière mise à jour : 16 mars 2025
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
};

export default PrivacyPolicyScreen;
