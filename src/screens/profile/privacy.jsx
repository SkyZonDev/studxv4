import { useNavigation } from '@react-navigation/native';
import PrivacyPage from '../../components/profile/PrivacyPage';
import { useUser } from '../../hooks/useUser';

export default function Privacy() {
    const { userData, isLoading } = useUser();
    const navigation = useNavigation();

    if (isLoading) {
        return null;
    }

    if (!userData) {
        navigation.replace('Login');
        return null;
    }

    return <PrivacyPage />;
}
