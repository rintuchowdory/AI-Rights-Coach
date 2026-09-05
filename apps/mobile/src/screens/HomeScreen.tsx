import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { api, ApiError } from "../api/client";
import { colors } from "../theme";

type Status = "checking" | "online" | "offline";

const QUICK_ACTIONS: { key: string; icon: string; title: string; subtitle: string }[] = [
  { key: "review", icon: "📄", title: "Review a document", subtitle: "Understand a notice or contract" },
  { key: "draft", icon: "✍️", title: "Draft a response", subtitle: "Write a calm, factual reply" },
  { key: "chat", icon: "💬", title: "Ask a question", subtitle: "Chat about your situation" },
  { key: "rights", icon: "⚖️", title: "Know your rights", subtitle: "Tenancy, work & consumer basics" },
];

export default function HomeScreen({
  onOpenReview,
  onOpenDraft,
  onOpenChat,
  onOpenRights,
}: {
  onOpenReview: () => void;
  onOpenDraft: () => void;
  onOpenChat: () => void;
  onOpenRights: () => void;
}) {
  const [status, setStatus] = useState<Status>("checking");
  const [detail, setDetail] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);

  const fade = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  const checkHealth = useCallback(async () => {
    setStatus("checking");
    try {
      const res = await api.health();
      setStatus("online");
      setDetail(res.service);
    } catch (err) {
      setStatus("offline");
      setDetail(err instanceof ApiError ? `${err.status}: ${err.message}` : String(err));
    }
  }, []);

  useEffect(() => {
    checkHealth();
    Animated.timing(fade, { toValue: 1, duration: 450, useNativeDriver: true }).start();
  }, [checkHealth, fade]);

  useEffect(() => {
    if (status !== "online") return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.35, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [status, pulse]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await checkHealth();
    setRefreshing(false);
  }, [checkHealth]);

  const runAction = (key: string) => {
    if (key === "review") onOpenReview();
    else if (key === "draft") onOpenDraft();
    else if (key === "chat") onOpenChat();
    else if (key === "rights") onOpenRights();
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl tintColor={colors.textSecondary} refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Animated.View style={{ opacity: fade }}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>⚖️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.brand}>AI Rights Coach</Text>
            <Text style={styles.brandSub}>Legal rights assistant</Text>
          </View>
          <View style={styles.statusPill}>
            <Animated.View
              style={[
                styles.dot,
                status === "online" ? styles.dotOnline : status === "offline" ? styles.dotOffline : styles.dotChecking,
                { transform: [{ scale: status === "online" ? pulse : 1 }] },
              ]}
            />
            <Text style={styles.statusPillText}>
              {status === "checking" ? "Checking…" : status === "online" ? "Online" : "Offline"}
            </Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroSpark}>✨</Text>
          <Text style={styles.heroTitle}>What's your issue?</Text>
          <Text style={styles.heroSubtitle}>
            Ask me anything about a notice, contract, or dispute — tenancy, employment, or consumer
            rights. I'll help you understand it and draft a reply.
          </Text>
          <Pressable style={styles.startChatBtn} onPress={onOpenChat} accessibilityRole="button">
            <Text style={styles.startChatText}>💬  Start chat</Text>
          </Pressable>
          {detail ? <Text style={styles.detailText}>{detail}</Text> : null}
        </View>

        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
        <View style={styles.grid}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.key}
              style={styles.tile}
              onPress={() => runAction(action.key)}
            >
              <View style={styles.tileIconWrap}>
                <Text style={styles.tileIcon}>{action.icon}</Text>
              </View>
              <Text style={styles.tileTitle}>{action.title}</Text>
              <Text style={styles.tileSubtitle}>{action.subtitle}</Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 20,
  },
  brand: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "700",
  },
  brandSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 1,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.cardAlt,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotOnline: { backgroundColor: colors.success },
  dotOffline: { backgroundColor: colors.danger },
  dotChecking: { backgroundColor: colors.textMuted },
  statusPillText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  hero: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  heroSpark: {
    fontSize: 20,
    marginBottom: 8,
  },
  heroTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
  },
  heroSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 18,
  },
  startChatBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  startChatText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  detailText: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 10,
    textAlign: "center",
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  tile: {
    width: "47%",
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  tileIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  tileIcon: {
    fontSize: 17,
  },
  tileTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 3,
  },
  tileSubtitle: {
    color: colors.textMuted,
    fontSize: 11.5,
    lineHeight: 15,
  },
});
