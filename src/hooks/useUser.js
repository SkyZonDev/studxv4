import { useContext } from 'react';
import UserContext from '../context/userContext';

export const useUser = () => {
    const context = useContext(UserContext);

    if (!context) {
        throw new Error('useUser doit être utilisé à l\'intérieur d\'un userProvider');
    }

    return context;
};
