import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

const TOPICS = [
  {
    icon: "🏠",
    title: "Tenancy",
    points: [
      "Landlords usually need a written, dated notice with a valid reason.",
      "Notice periods depend on how long you've lived there — check your contract.",
      "You can request repairs in writing and keep a paper trail.",
    ],
  },
  {
    icon: "💼",
    title: "Employment",
    points: [
      "Terminations often require written notice and a valid reason.",
      "Keep copies of your contract, warnings, and performance reviews.",
      "Unpaid wages or overtime should be requested in writing first.",
    ],
  },
  {
    icon: "🛒",
    title: "Consumer",
    points: [
      "Keep your receipt or order confirmation for any dispute.",
      "Faulty goods usually qualify for repair, replacement, or refund.",
      "Written promises from a seller are more enforceable than verbal ones.",
    ],
  },
];

export default function KnowYourRightsScreen() {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Know your rights</Text>
      <Text style={styles.subtitle}>
        General starting points — not legal advice. For anything serious, a local advice service or
        lawyer can confirm what applies to your situation.
      </Text>

      {TOPICS.map((topic) => (
        <View key={topic.title} style={styles.card}>
          <Text style={styles.cardIcon}>{topic.icon}</Text>
          <Text style={styles.cardTitle}>{topic.title}</Text>
          {topic.points.map((point) => (
            <Text key={point} style={styles.cardText}>
              •  {point}
            </Text>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    padding: 20,
    paddingBottom: 32,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13.5,
    lineHeight: 20,
    marginBottom: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 14,
  },
  cardIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  cardText: {
    color: colors.textSecondary,
    fontSize: 13.5,
    lineHeight: 20,
    marginBottom: 4,
  },
});
