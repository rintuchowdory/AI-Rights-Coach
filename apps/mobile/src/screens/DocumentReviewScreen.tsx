import { StyleSheet, Text, View, Pressable, ScrollView } from "react-native";

export default function DocumentReviewScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
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

      <Pressable style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Upload document</Text>
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
  primaryButton: {
    backgroundColor: "#4f46e5",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
