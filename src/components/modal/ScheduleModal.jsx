import { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, PanResponder, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ScheduleModal = ({ selectedCourse, colors, toggleCourseDetails, visible = false }) => {
    // Référence pour l'animation de glissement
    const panY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Réinitialiser panY quand le modal est fermé
        if (!visible) {
            panY.setValue(0);
        }
    }, [visible]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                // Ne permettre que le glissement vers le bas
                if (gestureState.dy > 0) {
                    panY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 80) {
                    // Fermer le modal si suffisamment glissé vers le bas
                    closeModal();
                } else {
                    // Revenir à la position d'origine
                    Animated.spring(panY, {
                        toValue: 0,
                        useNativeDriver: true,
                        bounciness: 5,
                    }).start();
                }
            },
        })
    ).current;

    const closeModal = () => {
        toggleCourseDetails(selectedCourse);
    };

    const formatTimeDisplay = (startTime, endTime) => {
        return `${startTime} - ${endTime}`;
    };

    // Calculer la position de l'animation
    const translateY = panY.interpolate({
        inputRange: [0, 300],
        outputRange: [0, 300],
        extrapolate: 'clamp'
    });

    // S'assurer que selectedCourse existe avant de l'utiliser
    if (!selectedCourse) return null;

    const DetailItem = ({ icon, label, value }) => (
        <View style={styles.detailsItem}>
            <View style={styles.iconContainer}>
                <Ionicons name={icon} size={22} color={colors.primary.main} />
            </View>
            <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={styles.detailsText}>{value}</Text>
            </View>
        </View>
    );

    const styles = StyleSheet.create({
        modalOverlay: {
            flex: 1,
            justifyContent: 'flex-end'
        },
        courseDetailsPanel: {
            backgroundColor: colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 16,
            paddingBottom: 24,
            paddingHorizontal: 24,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            marginBottom: 0,
        },
        dragHandleArea: {
            width: '100%',
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: -10,
            paddingTop: 10,
        },
        modalDragBar: {
            width: 40,
            height: 5,
            backgroundColor: colors.border,
            borderRadius: 3,
            marginBottom: 16,
        },
        detailsHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
        },
        titleContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
        },
        courseColorIndicator: {
            width: 6,
            height: 28,
            borderRadius: 3,
            marginRight: 12,
        },
        detailsTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: colors.text.primary,
            flex: 1,
        },
        closeButton: {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.border,
            justifyContent: 'center',
            alignItems: 'center',
        },
        detailsContent: {
            marginBottom: 24,
        },
        detailsItem: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 14,
        },
        iconContainer: {
            width: 42,
            height: 42,
            borderRadius: 12,
            backgroundColor: colors.border,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 16,
        },
        detailTextContainer: {
            flex: 1,
        },
        detailLabel: {
            fontSize: 13,
            color: colors.text.primary,
            marginBottom: 2,
        },
        detailsText: {
            fontSize: 16,
            color: colors.text.primary,
            fontWeight: '500',
        },
        separator: {
            height: 1,
            backgroundColor: colors.border,
            marginVertical: 2,
        },
    });

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={closeModal}
        >
            <View style={styles.modalOverlay}>
                <Animated.View
                    style={[
                        styles.courseDetailsPanel,
                        {
                            transform: [{ translateY }]
                        }
                    ]}
                >
                    {/* Zone de la barre de glissement */}
                    <View {...panResponder.panHandlers} style={styles.dragHandleArea}>
                        <View style={styles.modalDragBar} />
                    </View>

                    <View style={styles.detailsHeader}>
                        <View style={styles.titleContainer}>
                            <View
                                style={[styles.courseColorIndicator, { backgroundColor: selectedCourse.color }]}
                            />
                            <Text style={styles.detailsTitle}>{selectedCourse.course}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={closeModal}
                            accessibilityLabel="Fermer les détails du cours"
                        >
                            <Ionicons name="close" size={22} color="#f00" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.detailsContent}>
                        <DetailItem
                            icon="time-outline"
                            label="Horaires"
                            value={formatTimeDisplay(selectedCourse.startTime, selectedCourse.endTime)}
                        />

                        <View style={styles.separator} />

                        <DetailItem
                            icon="person-outline"
                            label="Enseignant"
                            value={selectedCourse.teacher}
                        />

                        <View style={styles.separator} />

                        <DetailItem
                            icon="location-outline"
                            label="Salle"
                            value={selectedCourse.room}
                        />
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};


export default ScheduleModal;
