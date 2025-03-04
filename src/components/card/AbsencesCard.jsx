import { View, Text, StyleSheet, TouchableOpacity, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useRef, useCallback } from 'react';

// Activer LayoutAnimation sur Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const AbsencesCard = ({ absence, openAbsenceDetail, setSelectedAbsence, setShowJustifyModal }) => {
    const [expanded, setExpanded] = useState(false);
    const [absenceActive, setAbsenceActive] = useState(false)
    const rotationAnimation = useRef(new Animated.Value(0)).current;

    // Pré-calculer l'affichage du professeur en dehors du rendu
    const displayTeacher = absence.teacher.length > 30
        ? absence.teacher.substring(0, 30) + '...'
        : absence.teacher;

    const toggleExpand = useCallback(() => {
        const newValue = !expanded;

        // Utiliser LayoutAnimation pour une animation de hauteur plus fluide
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(newValue);

        // Utiliser useNativeDriver: true pour l'animation de rotation
        Animated.timing(rotationAnimation, {
            toValue: newValue ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [expanded, rotationAnimation]);

    const rotateIcon = rotationAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    // Pré-calculer les styles conditionnels
    const statusBackgroundColor = absence.status === 'Justifiée' ? '#66BB6A20' : '#FF8A6520';
    const statusTextColor = absence.status === 'Justifiée' ? '#66BB6A' : '#FF8A65';

    return (
        <View style={styles.absenceItem}>
            <TouchableOpacity
                style={styles.mainContent}
                onPress={toggleExpand}
                activeOpacity={0.7}
            >
                <View style={styles.absenceHeader}>
                    <View style={styles.absenceDate}>
                        <Ionicons name="calendar" size={16} color="#757575" />
                        <Text style={styles.absenceDateText}>{absence.date}</Text>
                    </View>
                    <View style={[styles.absenceStatus, { backgroundColor: statusBackgroundColor }]}>
                        <Text style={[styles.statusText, { color: statusTextColor }]}>
                            {absence.status}
                        </Text>
                    </View>
                </View>

                <View style={styles.titleRow}>
                    <Text style={styles.absenceCourse}>{absence.course}</Text>
                    <Animated.View style={{ transform: [{ rotate: rotateIcon }] }}>
                        <Ionicons name="chevron-down" size={20} color="#757575" />
                    </Animated.View>
                </View>
            </TouchableOpacity>

            {expanded && (
                <View style={styles.collapsibleContent}>
                    <View style={styles.absenceDetails}>
                        <View style={styles.infoItem}>
                            <Ionicons name="time" size={14} color="#757575" />
                            <Text style={styles.infoText}>{absence.time}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Ionicons name="person" size={14} color="#757575" />
                            <Text style={styles.infoText}>{displayTeacher}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Ionicons name="location" size={14} color="#757575" />
                            <Text style={styles.infoText} numberOfLines={1} ellipsizeMode='tail'>{absence.room}</Text>
                        </View>
                    </View>

                    <View style={[styles.buttonContainer, { justifyContent: absenceActive ? 'space-between' : 'center' }]}>
                        {absenceActive ?
                            absence.status === 'Non justifiée' ? (
                                <TouchableOpacity
                                    style={styles.justifyButton}
                                    onPress={() => {
                                        setSelectedAbsence(absence);
                                        setShowJustifyModal(true);
                                    }}
                                >
                                    <Text style={styles.justifyButtonText}>Justifier</Text>
                                </TouchableOpacity>
                            ) : absence.justificationDate && (
                                <Text style={styles.justificationText}>
                                    Justifiée le {absence.justificationDate}
                                </Text>
                            )
                        : null}

                        <TouchableOpacity
                            style={[styles.justifyButton, styles.transparentButton]}
                            onPress={() => openAbsenceDetail(absence)}
                        >
                            <Text style={styles.detailButtonText}>Voir plus de détails</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    absenceItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 15,
        elevation: 2,
        overflow: 'hidden',
    },
    mainContent: {
        padding: 15,
    },
    absenceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    absenceDate: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    absenceDateText: {
        fontSize: 14,
        color: '#757575',
        marginLeft: 5,
    },
    absenceStatus: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    absenceCourse: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    collapsibleContent: {
        paddingHorizontal: 15,
        paddingBottom: 5,
    },
    absenceDetails: {
        marginBottom: 15,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 15,
        marginBottom: 10,
        maxWidth: '90%'
    },
    infoText: {
        fontSize: 14,
        color: '#757575',
        marginLeft: 5,
        flexShrink: 1,
    },
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    justifyButton: {
        backgroundColor: '#4A6FE120',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 15,
        alignSelf: 'flex-start',
        marginBottom: 10,
    },
    justifyButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4A6FE1',
    },
    justificationText: {
        fontSize: 14,
        color: '#66BB6A',
        fontStyle: 'italic',
        marginBottom: 10,
    },
    transparentButton: {
        backgroundColor: 'transparent',
    },
    detailButtonText: {
        fontSize: 14,
        color: '#4A6FE1',
        fontWeight: '500',
    },
});

// Vous pouvez utiliser React.memo ici si vous voulez toujours optimiser les re-rendus
// const MemoizedAbsencesCard = React.memo(AbsencesCard);
// export default MemoizedAbsencesCard;

export default AbsencesCard;
