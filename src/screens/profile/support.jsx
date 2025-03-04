import { useNavigation } from '@react-navigation/native';
import SupportPage from '../../components/profile/SupportPage';
import { useUser } from '../../hooks/useUser';

export default function Support() {
    const { userData, isLoading } = useUser();
    const navigation = useNavigation();

    if (isLoading) {
        return null;
    }

    if (!userData) {
        navigation.replace('Login');
        return null;
    }

    return <SupportPage />;
}
