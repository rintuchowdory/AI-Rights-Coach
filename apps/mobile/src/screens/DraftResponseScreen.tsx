import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { API_URL } from "../api/client";
import { colors } from "../theme";

async function draftReply(
  situation: string,
  documentText: string
): Promise<string> {
  const res = await fetch(`${API_URL}/ai/draft-reply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      situation,
      document_text: documentText.trim() ? documentText.trim() : undefined,
    }),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`${res.status}: ${msg.slice(0, 160)}`);
  }
  const data = (await res.json()) as { draft: string };
  return data.draft;
}

export default function DraftResponseScreen() {
  const [situation, setSituation] = useState("");
  const [documentText, setDocumentText] = useState("");
  const [draft, setDraft] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    const situationTrimmed = situation.trim();
    if (situationTrimmed.length < 5 || busy) return;
    setError(null);
    setBusy(true);
    setDraft(null);
    try {
      const text = await draftReply(situationTrimmed, documentText);
      setDraft(text);
    } catch (e) {
      setError(
        e instanceof Error
          ? `Draft failed (${e.message}). Try again in a moment.`
          : "Draft failed. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Draft response</Text>
      <Text style={styles.subtitle}>
        Describe your situation — the AI writes a calm, factual reply you can send.
      </Text>

      <Text style={styles.label}>1. What happened?</Text>
      <Box placeholder="e.g. My landlord wants to keep part of my deposit for repainting after 4 years of tenancy…" value={situation} onChangeText={setSituation} minLines={3} />

      <Text style={styles.label}>2. Received a letter? (optional)</Text>
      <Box placeholder="Paste the notice or claim text here…" value={documentText} onChangeText={setDocumentText} minLines={3} />

      <Pressable
        style={[styles.primaryButton, busy && styles.buttonDisabled]}
        onPress={generate}
        accessibilityRole="button"
        disabled={busy}
      >
        <Text style={styles.primaryButtonText}>
          {busy ? "Writing your draft…" : "Generate draft"}
        </Text>
      </Pressable>

      {busy && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loadingText}>This usually takes a few seconds…</Text>
        </View>
      )}

      {error && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚠️ {error}</Text>
        </View>
      )}

      {draft && (
        <View style={styles.resultCard}>
          <Text style={styles.previewLabel}>Your draft</Text>
          <Text style={styles.draftText}>{draft}</Text>
          {Platform.OS === "web" && <CopyButton text={draft} />}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Suggested structure</Text>
        <Text style={styles.cardText}>1. Acknowledge receipt of the document.</Text>
        <Text style={styles.cardText}>2. State the key facts without admitting fault.</Text>
        <Text style={styles.cardText}>3. Ask for clarification or supporting documents.</Text>
        <Text style={styles.cardText}>4. Set a reasonable timeline for your reply.</Text>
      </View>
    </ScrollView>
  );
}

function Box({
  placeholder,
  value,
  onChangeText,
  minLines,
}: {
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  minLines: number;
}) {
  if (Platform.OS !== "web") return null;
  return (
    <View style={styles.pasteBox}>
      <textarea
        style={{
          width: "100%",
          minHeight: minLines * 22,
          backgroundColor: "transparent",
          color: colors.textPrimary,
          border: "none",
          outline: "none",
          fontSize: 14,
          fontFamily: "inherit",
          resize: "vertical",
        }}
        placeholder={placeholder}
        value={value}
        onChange={(e: any) => onChangeText(e.target.value)}
      />
    </View>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Pressable
      style={styles.copyButton}
      accessibilityRole="button"
      onPress={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        });
      }}
    >
      <Text style={styles.copyButtonText}>{copied ? "Copied ✓" : "Copy draft"}</Text>
    </Pressable>
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
    gap: 12,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 2,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14.5,
    lineHeight: 20,
    marginBottom: 4,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  pasteBox: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 2,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 13.5,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 4,
  },
  resultCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: 14,
    gap: 8,
  },
  previewLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 15.5,
    fontWeight: "800",
    marginBottom: 4,
  },
  cardText: {
    color: colors.textMuted,
    fontSize: 13.5,
    lineHeight: 19,
  },
  draftText: {
    color: colors.textPrimary,
    fontSize: 14.5,
    lineHeight: 21,
  },
  copyButton: {
    marginTop: 4,
    alignSelf: "flex-start",
    backgroundColor: colors.accentSoft,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  copyButtonText: {
    color: colors.accent,
    fontSize: 13.5,
    fontWeight: "700",
  },
});
