import { StyleSheet, Text, View, Pressable, ScrollView } from "react-native";

export default function DraftResponseScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
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
          “Thank you for your message. I have reviewed the document and would appreciate the opportunity to
          understand the basis of the claim in more detail. Please share the specific terms, dates, and any
          supporting documents so I can respond accurately and promptly.”
        </Text>
      </View>

      <Pressable style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Generate draft</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f8fafc",
    padding: 20,
  },
  title: {
    color: "#0f172a",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    color: "#475569",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#94a3b8",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardTitle: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  cardText: {
    color: "#334155",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 2,
  },
  previewCard: {
    backgroundColor: "#ecfeff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  previewLabel: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  previewText: {
    color: "#0f172a",
    fontSize: 14,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: "#14b8a6",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
