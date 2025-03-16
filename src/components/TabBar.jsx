import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useTheme } from '../context/themeContext';
import { Calendar, Clock, Home, PencilLine, User } from 'lucide-react-native';

const TabBar = ({ state, descriptors, navigation }) => {
    const { colors } = useTheme();

    // Memoize the icons to prevent unnecessary re-renders
    const icons = useMemo(() => ({
        index: (props) => <Home {...props} />,
        schedule: (props) => <Calendar {...props} />,
        notes: (props) => <PencilLine {...props} />,
        absences: (props) => <Clock {...props} />,
        profile: (props) => <User {...props} />
    }), []);

    const styles = StyleSheet.create({
        container: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            marginBottom: -1,
            elevation: 10,
            shadowColor: colors.shadow || '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
        },
        tabbar: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            // borderRadius: 25,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: colors.card.border || 'rgba(0,0,0,0.05)',
        },
        tabItem: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 8,
            position: 'relative',
        },
        activeIndicator: {
            display: 'none',
            position: 'absolute',
            bottom: 0,
            height: 3,
            width: '60%',
            borderRadius: 3,
            backgroundColor: colors.primary.main || colors.primary,
        },
        iconContainer: {
            padding: 8,
            borderCurve: "circular",
            borderRadius: 16,
            overflow: 'hidden'
        },
        label: {
            fontSize: 12,
            fontWeight: '500',
            textAlign: 'center',
        },
        badge: {
            position: 'absolute',
            right: 0,
            top: 0,
            backgroundColor: colors.error || '#FF5252',
            borderRadius: 10,
            width: 16,
            height: 16,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1,
        },
        badgeText: {
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: 'bold',
        }
    });

    // Helper function to get icon color based on active state
    const getIconColor = (isFocused) => {
        return isFocused
            ? colors.primary.main || colors.primary
            : colors.text.secondary || colors.text.primary;
    };

    // Helper function to get text color based on active state
    const getTextColor = (isFocused) => {
        return isFocused
            ? colors.primary.main || colors.primary
            : colors.text.secondary || colors.text.primary;
    };

    // Helper function to get background color for icon container based on active state
    const getIconBgColor = (isFocused) => {
        return isFocused
            ? `${colors.primary.main || colors.primary}15` // 15% opacity
            : 'transparent';
    };

    return (
        <View style={styles.container}>
            <View style={styles.tabbar}>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];

                    // Skip hidden tabs
                    if (options.tabBarItemStyle && options.tabBarItemStyle.display === 'none') {
                        return null;
                    }

                    const label =
                        options.tabBarLabel !== undefined
                            ? options.tabBarLabel
                            : options.title !== undefined
                                ? options.title
                                : route.name.charAt(0).toUpperCase() + route.name.slice(1);

                    const isFocused = state.index === index;

                    // Get badge count from options if available
                    const badge = options.tabBarBadge;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name, route.params);
                        }
                    };

                    const onLongPress = () => {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    };

                    return (
                        <TouchableOpacity
                            key={route.key}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            testID={options.tabBarTestID}
                            onPress={onPress}
                            onLongPress={onLongPress}
                            style={styles.tabItem}
                            activeOpacity={0.7}
                        >
                            {isFocused && <View style={styles.activeIndicator} />}

                            <View
                                style={[
                                    styles.iconContainer,
                                    { backgroundColor: getIconBgColor(isFocused) }
                                ]}
                            >
                                {badge && (
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
                                    </View>
                                )}

                                {icons[route.name] && icons[route.name]({
                                    color: getIconColor(isFocused),
                                    size: 22,
                                    strokeWidth: isFocused ? 2.5 : 2,
                                })}

                            </View>

                            <Text
                                style={[
                                    styles.label,
                                    {
                                        color: getTextColor(isFocused),
                                        opacity: isFocused ? 1 : 0.8
                                    }
                                ]}
                                numberOfLines={1}
                            >
                                {label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

export default TabBar;
