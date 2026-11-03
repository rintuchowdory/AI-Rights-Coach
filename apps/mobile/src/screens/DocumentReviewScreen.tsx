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

// ---------------------------------------------------------------- deadlines
export type Deadline = {
  due_date: string;
  days_left: number;
  urgency: "overdue" | "critical" | "soon" | "later";
  title: string;
  legal_basis: string;
  action: string;
  evidence: string;
  confidence: number;
  source: string;
};

export type DeadlineResult = {
  summary: string;
  deadlines: Deadline[];
  statute_hints: { action: string; legal_basis: string }[];
  today: string;
  disclaimer: string;
};

const URGENCY_COLOR: Record<Deadline["urgency"], string> = {
  overdue: colors.danger,
  critical: "#F97316",
  soon: "#EAB308",
  later: colors.success,
};

const URGENCY_LABEL: Record<Deadline["urgency"], string> = {
  overdue: "abgelaufen",
  critical: "jetzt handeln",
  soon: "bald",
  later: "später",
};

/** Deadlines are computed on the server; the client only formats them. */
async function fetchDeadlines(payload: Record<string, unknown>): Promise<DeadlineResult> {
  const res = await fetch(`${API_URL}/ai/deadlines`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, today: new Date().toISOString().slice(0, 10) }),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`${res.status}: ${msg.slice(0, 160)}`);
  }
  return res.json();
}

function formatGermanDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${d}.${m}.${y}` : iso;
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
  const [deadlines, setDeadlines] = useState<DeadlineResult | null>(null);
  const [deadlinesError, setDeadlinesError] = useState<string | null>(null);

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
      setDeadlines(null);
      setDeadlinesError(null);
      try {
        const parsed = await readWebFile(file);
        const payload =
          parsed.mode === "text"
            ? { text: parsed.data }
            : { image_base64: parsed.data, mime_type: parsed.mime };
        // The deadline check must never block the explanation.
        const [analysis, found] = await Promise.allSettled([
          analyze(parsed.mode, parsed.data, parsed.mime),
          fetchDeadlines(payload),
        ]);
        if (found.status === "fulfilled") setDeadlines(found.value);
        else setDeadlinesError("Fristen konnten nicht geprüft werden.");
        if (analysis.status === "rejected") throw analysis.reason;
        setResult(analysis.value);
      } catch (e) {
        setError(
          e instanceof Error && e.message
            ? `Prüfung fehlgeschlagen (${e.message}). Falls es bleibt: den Text unten einfügen.`
            : "Prüfung fehlgeschlagen. Bitte noch einmal versuchen."
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
    setDeadlines(null);
    setDeadlinesError(null);
    try {
      const body = text.slice(0, MAX_TEXT_CHARS);
      const [analysis, found] = await Promise.allSettled([
        analyze("text", body),
        fetchDeadlines({ text: body }),
      ]);
      if (found.status === "fulfilled") setDeadlines(found.value);
      else setDeadlinesError("Fristen konnten nicht geprüft werden.");
      if (analysis.status === "rejected") throw analysis.reason;
      setResult(analysis.value);
    } catch (e) {
      setError(e instanceof Error ? `Prüfung fehlgeschlagen (${e.message}).` : "Prüfung fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Dokument prüfen</Text>
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
          {busy ? "Prüfe…" : "Bild oder Datei hochladen"}
        </Text>
      </Pressable>
      <Text style={styles.hint}>
        Bilder (JPG/PNG, max. 4 MB) liest die App automatisch per OCR. Textdateien
        (.txt/.md) gehen direkt. PDFs: den Text unten einfügen.
      </Text>

      <Text style={styles.pasteLabel}>Oder den Text einfügen:</Text>
      <TextInputCard value={pasted} onChangeText={setPasted} onSubmit={analyzePasted} busy={busy} />

      {busy && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loadingText}>Die KI liest dein Schreiben…</Text>
        </View>
      )}

      {error && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚠️ {error}</Text>
        </View>
      )}

      {deadlines && <DeadlinePanel data={deadlines} />}

      {deadlinesError && (
        <View style={styles.card}>
          <Text style={styles.cardText}>{deadlinesError}</Text>
        </View>
      )}

      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.cardTitle}>
            KI-Prüfung{fileName ? ` — ${fileName}` : ""}
          </Text>
          <Text style={styles.explanation}>{result.explanation}</Text>
          {result.ocr_text ? (
            <View style={styles.ocrBox}>
              <Text style={styles.ocrLabel}>Extrahierter Text</Text>
              <Text style={styles.ocrText}>{result.ocr_text}</Text>
            </View>
          ) : null}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Was die KI prüft</Text>
        <Text style={styles.cardText}>• Absender und alle Fristen</Text>
        <Text style={styles.cardText}>• Pflichten, Vorwürfe und Forderungen</Text>
        <Text style={styles.cardText}>• Fehlende Kündigungsfristen oder unklare Gebühren</Text>
        <Text style={styles.cardText}>• Was unfair oder unwirksam wirkt</Text>
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
          placeholder="Brief oder Vertragstext hier einfügen…"
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
        <Text style={styles.primaryButtonText}>Text analysieren</Text>
      </Pressable>
    </View>
  );
}

function DeadlinePanel({ data }: { data: DeadlineResult }) {
  return (
    <View style={styles.deadlineCard}>
      <Text style={styles.deadlineHeading}>Fristen</Text>
      <Text style={styles.deadlineSummary}>{data.summary}</Text>

      {data.deadlines.map((item) => {
        const tint = URGENCY_COLOR[item.urgency] ?? colors.textMuted;
        return (
          <View key={`${item.due_date}-${item.title}`} style={styles.deadlineRow}>
            <View style={styles.deadlineTopRow}>
              <View style={[styles.badge, { borderColor: tint }]}>
                <Text style={[styles.badgeText, { color: tint }]}>
                  {item.days_left < 0 ? `${Math.abs(item.days_left)} Tage her` : `${item.days_left} Tage`}
                </Text>
              </View>
              <Text style={[styles.deadlineWhen, { color: tint }]}>
                {formatGermanDate(item.due_date)} · {URGENCY_LABEL[item.urgency] ?? ""}
              </Text>
            </View>
            <Text style={styles.deadlineTitle}>{item.title}</Text>
            {item.legal_basis ? <Text style={styles.deadlineBasis}>{item.legal_basis}</Text> : null}
            {item.action ? <Text style={styles.deadlineAction}>{item.action}</Text> : null}
            {item.evidence ? (
              <Text style={styles.deadlineEvidence} numberOfLines={2}>
                „{item.evidence.trim()}“
              </Text>
            ) : null}
          </View>
        );
      })}

      {data.deadlines.length === 0 && data.statute_hints.length > 0 && (
        <View style={styles.deadlineRow}>
          <Text style={styles.deadlineTitle}>Gesetzliche Fristen zum Thema</Text>
          {data.statute_hints.map((hint) => (
            <Text key={hint.legal_basis} style={styles.deadlineAction}>
              • {hint.action} ({hint.legal_basis})
            </Text>
          ))}
        </View>
      )}

      <Text style={styles.deadlineDisclaimer}>{data.disclaimer}</Text>
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
  deadlineCard: {
    backgroundColor: colors.cardAlt,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 10,
  },
  deadlineHeading: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
  deadlineSummary: {
    color: colors.textSecondary,
    fontSize: 13.5,
    lineHeight: 19,
  },
  deadlineRow: {
    backgroundColor: colors.bgElevated,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  deadlineTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "800",
  },
  deadlineWhen: {
    fontSize: 12.5,
    fontWeight: "700",
  },
  deadlineTitle: {
    color: colors.textPrimary,
    fontSize: 14.5,
    fontWeight: "700",
  },
  deadlineBasis: {
    color: colors.accent,
    fontSize: 12.5,
    fontWeight: "700",
  },
  deadlineAction: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  deadlineEvidence: {
    color: colors.textMuted,
    fontSize: 12,
    fontStyle: "italic",
    lineHeight: 17,
  },
  deadlineDisclaimer: {
    color: colors.textMuted,
    fontSize: 11.5,
    lineHeight: 16,
  },
});
