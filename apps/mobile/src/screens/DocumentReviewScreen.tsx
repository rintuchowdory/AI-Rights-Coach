import { StyleSheet, Text, View, Pressable, ScrollView } from "react-native";
import { colors } from "../theme";

export default function DocumentReviewScreen() {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Review document</Text>
      <Text style={styles.subtitle}>
        Share the notice or contract you need help understanding.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>What to check</Text>
        <Text style={styles.cardText}>• Who sent it and when</Text>
        <Text style={styles.cardText}>• Any deadlines or payment dates</Text>
        <Text style={styles.cardText}>• Key obligations, accusations, or demands</Text>
        <Text style={styles.cardText}>• Anything already agreed in writing</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Likely issues to flag</Text>
        <Text style={styles.cardText}>• Missing notice periods</Text>
        <Text style={styles.cardText}>• Unclear fees or penalties</Text>
        <Text style={styles.cardText}>• Restrictive or unfair terms</Text>
        <Text style={styles.cardText}>• Unclear legal authority</Text>
      </View>

      <Pressable style={styles.primaryButton} accessibilityRole="button">
        <Text style={styles.primaryButtonText}>Upload document</Text>
      </Pressable>
      <Text style={styles.hint}>
        Upload will unlock once the AI/OCR provider key is configured on the backend.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
  },
  cardText: {
    color: colors.textSecondary,
    fontSize: 13.5,
    lineHeight: 21,
    marginBottom: 2,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  hint: {
    color: colors.textMuted,
    fontSize: 11.5,
    textAlign: "center",
    marginTop: 10,
  },
});
