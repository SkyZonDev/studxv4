import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '../context/themeContext';
import { UserProvider } from '../context/userContext';
import ToastProvider from '../context/toastContext';
import { AbsencesProvider } from '../context/absencesContext';
import { CalendarProvider } from '../context/calendarContext';
import { GradeProvider } from '../context/gradesContext';
import { useTheme } from '../context/themeContext';
import { useUser } from '../hooks/useUser';

import TabBar from '../components/TabBar';
import ErrorBoundary from '../components/ErrorBoundary';
import LoadingScreen from '../components/LoadingScreen';

// Import your screens here
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import GradesScreen from '../screens/GradesScreen';
import AbsencesScreen from '../screens/AbsencesScreen';
import ProfileScreen from '../screens/ProfileScreen';


// Create the navigators
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// TabNavigator for authenticated routes
const TabNavigator = () => {
    const { colors } = useTheme();

    return (
        <Tab.Navigator
            screenOptions={{
                headerStyle: {
                    backgroundColor: colors.background,
                    elevation: 0,
                    shadowOpacity: 0,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border || 'rgba(0,0,0,0.1)',
                },
                headerTintColor: colors.text.primary,
                headerTitleStyle: {
                    fontWeight: '600',
                },
                tabBarHideOnKeyboard: true,
            }}
            tabBar={props => <TabBar {...props} />}
            initialRouteName="index"
        >
        <Tab.Screen
            name="index"
            component={HomeScreen}
            options={{
                title: 'Accueil',
                tabBarLabel: 'Accueil',
                headerShown: false
            }}
        />
        <Tab.Screen
            name="schedule"
            component={ScheduleScreen}
            options={{
                title: 'Emploi du temps',
                tabBarLabel: 'Agenda',
                headerShown: false,
            }}
        />
        <Tab.Screen
            name="notes"
            component={GradesScreen}
            options={{
                title: 'Notes',
                tabBarLabel: 'Notes',
                headerShown: false,
            }}
        />
        <Tab.Screen
            name="absences"
            component={AbsencesScreen}
            options={{
                title: 'Absences',
                tabBarLabel: 'Absences',
                headerShown: false,
            }}
        />
        <Tab.Screen
            name="profile"
            component={ProfileScreen}
            options={{
                title: 'Profil',
                tabBarLabel: 'Profil',
                headerShown: false,
                tabBarItemStyle: { display: "none"}
            }}
        />
        </Tab.Navigator>
    );
};

// Authentication stack
const AuthStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'fade'
            }}
        >
            <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
    );
};

// Root navigator
const Navigation = () => {
    const { isLoading, isAuthenticated } = useUser();

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {isLoading ? (
                    <Stack.Screen name="Loading" component={LoadingScreen} options={{ headerShown: false }} />
                ) : isAuthenticated ? (
                    <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
                ) : (
                    <Stack.Screen name="Auth" component={AuthStack} options={{ headerShown: false }} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

const AppNavigation = () => {
    return (
        <ErrorBoundary>
            <SafeAreaProvider>
                <ThemeProvider>
                    <ToastProvider>
                        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
                        <UserProvider>
                            <CalendarProvider>
                                <AbsencesProvider>
                                    <GradeProvider>
                                        <Navigation />
                                    </GradeProvider>
                                </AbsencesProvider>
                            </CalendarProvider>
                        </UserProvider>
                    </ToastProvider>
                </ThemeProvider>
            </SafeAreaProvider>
        </ErrorBoundary>
    )
}

export default AppNavigation;
