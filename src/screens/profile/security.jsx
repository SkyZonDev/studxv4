import { useNavigation } from '@react-navigation/native';
import SecurityPage from '../../components/profile/SecurityPage';
import { useUser } from '../../hooks/useUser';

export default function Security() {
    const { userData, isLoading } = useUser();
    const navigation = useNavigation();

    if (isLoading) {
        return null;
    }

    if (!userData) {
        navigation.replace('Login');
        return null;
    }

    return <SecurityPage />;
}
