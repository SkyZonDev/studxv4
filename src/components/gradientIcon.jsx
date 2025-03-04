import { Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

const GradientIcon = (props) => {
    return (
        <MaskedView maskElement={<Ionicons {...props} color="white" />}>
            <LinearGradient
                colors={props.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Ionicons {...props} style={{ opacity: 0 }} />
            </LinearGradient>
        </MaskedView>
    );
};

export default GradientIcon;
