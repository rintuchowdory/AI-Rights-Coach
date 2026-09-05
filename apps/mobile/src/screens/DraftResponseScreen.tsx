import { StyleSheet, Text, View, Pressable, ScrollView } from "react-native";
import { colors } from "../theme";

export default function DraftResponseScreen() {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Draft response</Text>
      <Text style={styles.subtitle}>
        Start from a neutral, factual summary before you respond.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Suggested structure</Text>
        <Text style={styles.cardText}>1. Acknowledge receipt of the document.</Text>
        <Text style={styles.cardText}>2. State the key facts without admitting fault.</Text>
        <Text style={styles.cardText}>3. Ask for clarification or supporting documents.</Text>
        <Text style={styles.cardText}>4. Set a reasonable timeline for your reply.</Text>
      </View>

      <View style={styles.previewCard}>
        <Text style={styles.previewLabel}>Sample wording</Text>
        <Text style={styles.previewText}>
          "Thank you for your message. I have reviewed the document and would appreciate the opportunity to
          understand the basis of the claim in more detail. Please share the specific terms, dates, and any
          supporting documents so I can respond accurately and promptly."
        </Text>
      </View>

      <Pressable style={styles.primaryButton} accessibilityRole="button">
        <Text style={styles.primaryButtonText}>Generate draft</Text>
      </Pressable>
      <Text style={styles.hint}>
        Full AI-generated drafts unlock once the AI provider key is configured on the backend.
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
  previewCard: {
    backgroundColor: colors.accentSoft,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  previewLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  previewText: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 21,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
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
