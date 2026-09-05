import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

export type TabKey = "Home" | "Chat" | "Documents" | "Draft" | "More";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "Home", label: "Home", icon: "🏠" },
  { key: "Chat", label: "Chat", icon: "💬" },
  { key: "Documents", label: "Documents", icon: "📄" },
  { key: "Draft", label: "Draft", icon: "✍️" },
  { key: "More", label: "More", icon: "☰" },
];

export default function BottomNav({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}) {
  return (
    <View style={styles.bar}>
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Pressable key={tab.key} style={styles.item} onPress={() => onChange(tab.key)}>
            <Text style={[styles.icon, isActive && styles.iconActive]}>{tab.icon}</Text>
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bgElevated,
    paddingTop: 8,
    paddingBottom: 10,
  },
  item: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  icon: {
    fontSize: 18,
    opacity: 0.55,
  },
  iconActive: {
    opacity: 1,
  },
  label: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "600",
  },
  labelActive: {
    color: colors.accent,
  },
});
