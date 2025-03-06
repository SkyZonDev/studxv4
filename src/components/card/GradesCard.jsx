import { Text, View, TouchableOpacity, StyleSheet } from "react-native";


const GradesCard = ({ item }) => (
    <TouchableOpacity
        style={styles.gradeItem}
        onPress={() => {
            // On pourrait ajouter une navigation vers un détail de la note ici
        }}
    >
        <View style={styles.gradeHeader}>
            <View style={[
                styles.gradeCircle,
                {
                    backgroundColor:
                        parseFloat(item.grade) >= 15 ? '#66BB6A20' :
                            parseFloat(item.grade) >= 10 ? '#4A6FE120' : '#FF8A6520'
                }
            ]}>
                <Text style={[
                    styles.gradeText,
                    {
                        color:
                            parseFloat(item.grade) >= 15 ? '#66BB6A' :
                                parseFloat(item.grade) >= 10 ? '#4A6FE1' : '#FF8A65'
                    }
                ]}>{item.grade.split('/')[0]}</Text>
            </View>
            <View style={styles.gradeDetails}>
                <Text style={styles.gradeCourse}>{item.course}</Text>
                <Text style={styles.gradeDate}>{item.libelle}</Text>
            </View>
            <View style={styles.coefficientBadge}>
                <Text style={styles.coefficientText}>Coeff. {item.coefficient}</Text>
            </View>
        </View>
        <View style={styles.gradeStats}>
            <View style={styles.statItem}>
                <Text style={styles.statLabel}>Moyenne classe</Text>
                <Text style={styles.statValue}>{item.average}</Text>
            </View>
            <View style={styles.statItem}>
                <Text style={styles.statLabel}>Écart</Text>
                <Text style={[
                    styles.statValue,
                    parseFloat(item.difference) > 0 ? styles.positiveGap : parseFloat(item.difference) < 0 ? styles.negativeGap : {}
                ]}>
                    {parseFloat(item.difference) > 0 ? '+' : ''}{item.difference}
                </Text>
            </View>
            <View style={styles.statItem}>
                <Text style={styles.statLabel}>Performance</Text>
                <Text style={styles.statValue}>
                    {parseFloat(item.difference) > 1 ? '👍' : parseFloat(item.difference) < -1 ? '👎' : '🔄'}
                </Text>
            </View>
        </View>
    </TouchableOpacity>
)

const styles = StyleSheet.create({
    gradeItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        overflow: 'hidden',
    },
    gradeHeader: {
        flexDirection: 'row',
        padding: 15,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    gradeCircle: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: '#FF8A6520',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    gradeText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF8A65',
    },
    gradeDetails: {
        flex: 1,
    },
    gradeCourse: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    gradeDate: {
        fontSize: 12,
        color: '#757575',
    },
    coefficientBadge: {
        backgroundColor: '#E6EFFF',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 4,
    },
    coefficientText: {
        fontSize: 12,
        color: '#4A6FE1',
        fontWeight: '500',
    },
    gradeStats: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: '#FAFAFA',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        padding: 5,
    },
    statLabel: {
        fontSize: 12,
        color: '#757575',
        marginBottom: 2,
    },
    statValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
    },
    positiveGap: {
        color: '#4CAF50',
    },
    negativeGap: {
        color: '#F44336',
    }
})

module.exports = GradesCard;
