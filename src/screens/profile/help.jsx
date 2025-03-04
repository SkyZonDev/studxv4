import { useNavigation } from '@react-navigation/native';
import HelpPage from '../../components/profile/HelpPage';
import { useUser } from '../../hooks/useUser';

export default function Help() {
    const { userData, isLoading } = useUser();
    const navigation = useNavigation();

    if (isLoading) {
        return null;
    }

    if (!userData) {
        navigation.replace('Login');
        return null;
    }

    return <HelpPage />;
}
