import { useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors } from "../theme";

type Message = {
  id: string;
  from: "bot" | "user";
  text: string;
};

const WELCOME =
  "Hi, I'm your AI Rights Coach. Tell me what's going on — a notice you received, a dispute with a landlord or employer, or a consumer issue — and I'll help you figure out what to check and how to respond.";

const NOTE =
  "Note: I'm running on quick guided rules right now, not a full AI model yet — the real AI provider key is still being set up. I can still point you to the right checklist and drafting screen.";

function guessReply(input: string): string {
  const text = input.toLowerCase();
  if (/(rent|landlord|eviction|tenant|lease|miete|wohnung|kündigung)/.test(text)) {
    return "This sounds tenancy-related. Check the notice for the sender, the date, and any deadline. Then open Review a document for a structured checklist, or Draft a response if you're ready to reply.";
  }
  if (/(fired|employer|job|work|termination|dismissal|arbeitgeber|kündigung|gehalt)/.test(text)) {
    return "For employment issues, note the exact dates, any written warnings, and your contract terms first. Review a document can help you spot missing notice periods or unclear terms.";
  }
  if (/(refund|consumer|purchase|warranty|bought|store|händler|rückgabe)/.test(text)) {
    return "For consumer disputes, keep your receipt/order confirmation and any written promises from the seller handy. I can help you draft a firm but polite refund request — try Draft a response.";
  }
  if (/(deadline|fristen?|when|date|zeit)/.test(text)) {
    return "Deadlines matter a lot here — missing one can weaken your position. Look for any date mentioned in the document and reply well before it. Want to open Review a document to double-check?";
  }
  return "Got it. Could you share a bit more — who sent it, what they're asking for, and by when? In the meantime, Review a document and Draft a response on the Home screen walk you through the key steps.";
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([{ id: "0", from: "bot", text: WELCOME }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const shownNote = useRef(false);

  const send = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const userMsg: Message = { id: Date.now().toString(), from: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    const delay = 550 + Math.random() * 400;
    setTimeout(() => {
      let reply = guessReply(trimmed);
      if (!shownNote.current) {
        reply = `${reply}\n\n${NOTE}`;
        shownNote.current = true;
      }
      setMessages((prev) => [...prev, { id: Date.now().toString() + "b", from: "bot", text: reply }]);
      setTyping(false);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }, delay);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((m) => (
          <Bubble key={m.id} message={m} />
        ))}
        {typing && <TypingBubble />}
      </ScrollView>

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Describe your situation…"
          placeholderTextColor={colors.textMuted}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={send}
          returnKeyType="send"
        />
        <Pressable style={styles.sendBtn} onPress={send} accessibilityRole="button">
          <Text style={styles.sendBtnText}>➤</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({ message }: { message: Message }) {
  const fade = useRef(new Animated.Value(0)).current;
  Animated.timing(fade, { toValue: 1, duration: 250, useNativeDriver: true }).start();

  const isUser = message.from === "user";
  return (
    <Animated.View
      style={[
        styles.bubbleRow,
        isUser ? styles.bubbleRowUser : styles.bubbleRowBot,
        { opacity: fade },
      ]}
    >
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
        <Text style={isUser ? styles.bubbleTextUser : styles.bubbleTextBot}>{message.text}</Text>
      </View>
    </Animated.View>
  );
}

function TypingBubble() {
  return (
    <View style={[styles.bubbleRow, styles.bubbleRowBot]}>
      <View style={[styles.bubble, styles.bubbleBot, styles.typingBubble]}>
        <Text style={styles.bubbleTextBot}>●●●</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  messages: {
    padding: 16,
    paddingBottom: 24,
    gap: 10,
  },
  bubbleRow: {
    flexDirection: "row",
  },
  bubbleRowUser: {
    justifyContent: "flex-end",
  },
  bubbleRowBot: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "82%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: colors.userBubble,
    borderTopRightRadius: 4,
  },
  bubbleBot: {
    backgroundColor: colors.botBubble,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typingBubble: {
    paddingVertical: 8,
  },
  bubbleTextUser: {
    color: "#FFFFFF",
    fontSize: 14.5,
    lineHeight: 20,
  },
  bubbleTextBot: {
    color: colors.textPrimary,
    fontSize: 14.5,
    lineHeight: 20,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bgElevated,
  },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 14.5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
});
