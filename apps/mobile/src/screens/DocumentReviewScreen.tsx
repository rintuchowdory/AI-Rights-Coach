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

type Analysis = {
  ocr_text: string | null;
  explanation: string;
};

const MAX_TEXT_CHARS = 20000;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB base64 limit on the API

async function analyze(
  mode: "text" | "image",
  data: string,
  mimeType?: string
): Promise<Analysis> {
  const body =
    mode === "text"
      ? JSON.stringify({ text: data })
      : JSON.stringify({ image_base64: data, mime_type: mimeType });
  const res = await fetch(`${API_URL}/ai/analyze-document`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`${res.status}: ${msg.slice(0, 160)}`);
  }
  return res.json();
}

/** Web file → base64 (without the data-URL prefix) or plain text. */
async function readWebFile(
  file: File
): Promise<{ mode: "text" | "image"; data: string; mime?: string }> {
  if (file.type.startsWith("image/")) {
    const buf = await file.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buf);
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    if (bytes.length > MAX_IMAGE_BYTES) throw new Error("Image too large (max 4 MB).");
    return { mode: "image", data: btoa(binary), mime: file.type };
  }
  // plain text-ish files (.txt, .md, .csv, …) — PDFs are not supported yet
  const text = await file.text();
  return { mode: "text", data: text.slice(0, MAX_TEXT_CHARS) };
}

export default function DocumentReviewScreen() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Analysis | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pickFile = () => {
    if (busy) return;
    setError(null);
    setResult(null);
    // Web file picker via hidden input
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,.txt,.md,.csv";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setFileName(file.name);
      setBusy(true);
      try {
        const parsed = await readWebFile(file);
        const analysis = await analyze(parsed.mode, parsed.data, parsed.mime);
        setResult(analysis);
      } catch (e) {
        setError(
          e instanceof Error && e.message
            ? `Analysis failed (${e.message}). If it keeps failing, paste the key text below instead.`
            : "Analysis failed. Please try again."
        );
      } finally {
        setBusy(false);
      }
    };
    input.click();
  };

  const [pasted, setPasted] = useState("");

  const analyzePasted = async () => {
    const text = pasted.trim();
    if (!text || busy) return;
    setError(null);
    setResult(null);
    setBusy(true);
    setFileName("pasted text");
    try {
      const analysis = await analyze("text", text.slice(0, MAX_TEXT_CHARS));
      setResult(analysis);
    } catch (e) {
      setError(e instanceof Error ? `Analysis failed (${e.message}).` : "Analysis failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Review document</Text>
      <Text style={styles.subtitle}>
        Upload a photo or scan of the notice — or paste its text — and the AI explains
        what it means, what deadlines matter, and how to respond.
      </Text>

      <Pressable
        style={[styles.primaryButton, busy && styles.buttonDisabled]}
        onPress={pickFile}
        accessibilityRole="button"
        disabled={busy}
      >
        <Text style={styles.primaryButtonText}>
          {busy ? "Analyzing…" : "Upload image or text file"}
        </Text>
      </Pressable>
      <Text style={styles.hint}>
        Images (JPG/PNG, max 4 MB) get OCR'd automatically. Text files (.txt/.md) work
        directly. PDFs: copy the text into the box below.
      </Text>

      <Text style={styles.pasteLabel}>Or paste the document text:</Text>
      <TextInputCard value={pasted} onChangeText={setPasted} onSubmit={analyzePasted} busy={busy} />

      {busy && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loadingText}>The AI is reading your document…</Text>
        </View>
      )}

      {error && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚠️ {error}</Text>
        </View>
      )}

      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.cardTitle}>
            AI review{fileName ? ` — ${fileName}` : ""}
          </Text>
          <Text style={styles.explanation}>{result.explanation}</Text>
          {result.ocr_text ? (
            <View style={styles.ocrBox}>
              <Text style={styles.ocrLabel}>Extracted text</Text>
              <Text style={styles.ocrText}>{result.ocr_text}</Text>
            </View>
          ) : null}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>What the AI checks</Text>
        <Text style={styles.cardText}>• Who sent it and any deadlines</Text>
        <Text style={styles.cardText}>• Key obligations, accusations, or demands</Text>
        <Text style={styles.cardText}>• Missing notice periods or unclear fees</Text>
        <Text style={styles.cardText}>• Anything that looks unfair or unenforceable</Text>
      </View>
    </ScrollView>
  );
}

function TextInputCard({
  value,
  onChangeText,
  onSubmit,
  busy,
}: {
  value: string;
  onChangeText: (v: string) => void;
  onSubmit: () => void;
  busy: boolean;
}) {
  return (
    <View style={styles.pasteBox}>
      {Platform.OS === "web" ? (
        <textarea
          style={{
            width: "100%",
            minHeight: 110,
            backgroundColor: "transparent",
            color: colors.textPrimary,
            border: "none",
            outline: "none",
            fontSize: 14,
            fontFamily: "inherit",
            resize: "vertical",
          }}
          placeholder="Paste the letter or contract text here…"
          value={value}
          onChange={(e: any) => onChangeText(e.target.value)}
        />
      ) : null}
      <Pressable
        style={[styles.primaryButton, styles.pasteButton, busy && styles.buttonDisabled]}
        onPress={onSubmit}
        accessibilityRole="button"
        disabled={busy}
      >
        <Text style={styles.primaryButtonText}>Analyze text</Text>
      </Pressable>
    </View>
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
    gap: 14,
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
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12.5,
    lineHeight: 17,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  pasteLabel: {
    color: colors.textPrimary,
    fontSize: 14.5,
    fontWeight: "700",
    marginTop: 6,
  },
  pasteBox: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 10,
  },
  pasteButton: {
    paddingVertical: 11,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
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
  explanation: {
    color: colors.textPrimary,
    fontSize: 14.5,
    lineHeight: 21,
  },
  ocrBox: {
    marginTop: 6,
    backgroundColor: colors.bg,
    borderRadius: 10,
    padding: 10,
  },
  ocrLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  ocrText: {
    color: colors.textMuted,
    fontSize: 12.5,
    lineHeight: 18,
  },
});
