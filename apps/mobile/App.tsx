import { Component, ErrorInfo, ReactNode, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import HomeScreen from "./src/screens/HomeScreen";
import DocumentReviewScreen from "./src/screens/DocumentReviewScreen";
import DraftResponseScreen from "./src/screens/DraftResponseScreen";
import ChatScreen from "./src/screens/ChatScreen";
import KnowYourRightsScreen from "./src/screens/KnowYourRightsScreen";
import { DatenschutzScreen, ImpressumScreen } from "./src/screens/LegalScreens";
import BottomNav, { TabKey } from "./src/components/BottomNav";
import { colors } from "./src/theme";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, padding: 24, justifyContent: "center", backgroundColor: colors.bg }}>
          <Text style={{ fontWeight: "700", fontSize: 18, marginBottom: 8, color: colors.textPrimary }}>
            Something crashed while rendering
          </Text>
          <Text selectable style={{ fontSize: 13, color: colors.danger }}>
            {this.state.error.name}: {this.state.error.message}
          </Text>
          <Text selectable style={{ fontSize: 11, color: colors.textMuted, marginTop: 12 }}>
            {this.state.error.stack}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [tab, setTab] = useState<TabKey>("Home");
  const [moreScreen, setMoreScreen] = useState<"menu" | "rights" | "impressum" | "datenschutz">("menu");

  const goTab = (next: TabKey) => {
    setMoreScreen("menu");
    setTab(next);
  };

  return (
    <ErrorBoundary>
      <View style={styles.root}>
        <View style={styles.content}>
          {tab === "Home" && (
            <HomeScreen
              onOpenReview={() => goTab("Documents")}
              onOpenDraft={() => goTab("Draft")}
              onOpenChat={() => goTab("Chat")}
              onOpenRights={() => {
                setTab("More");
                setMoreScreen("rights");
              }}
            />
          )}
          {tab === "Chat" && <ChatScreen />}
          {tab === "Documents" && <DocumentReviewScreen />}
          {tab === "Draft" && <DraftResponseScreen />}
          {tab === "More" && moreScreen !== "menu" && (
            <View style={styles.backRow}>
              <Text style={styles.backLink} onPress={() => setMoreScreen("menu")}>
                ← Zurück
              </Text>
            </View>
          )}
          {tab === "More" && moreScreen === "rights" && <KnowYourRightsScreen />}
          {tab === "More" && moreScreen === "impressum" && <ImpressumScreen />}
          {tab === "More" && moreScreen === "datenschutz" && <DatenschutzScreen />}
          {tab === "More" && moreScreen === "menu" && (
            <View style={styles.morePlaceholder}>
              <Text style={styles.moreTitle}>Mehr</Text>
              <Text style={styles.moreLink} onPress={() => setMoreScreen("rights")}>
                ⚖️  Deine Rechte
              </Text>
              <Text style={styles.moreLink} onPress={() => setMoreScreen("impressum")}>
                📄  Impressum
              </Text>
              <Text style={styles.moreLink} onPress={() => setMoreScreen("datenschutz")}>
                🔒  Datenschutz
              </Text>
              <Text style={styles.moreNote}>
                Diese App erklärt Dokumente und schlägt Antworten vor. Sie ist keine
                Rechtsberatung und ersetzt keine Anwältin und keinen Anwalt.
              </Text>
            </View>
          )}
        </View>
        <BottomNav active={tab} onChange={goTab} />
      </View>
      <StatusBar style="light" />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
  },
  morePlaceholder: {
    flex: 1,
    padding: 20,
  },
  moreTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 20,
  },
  backRow: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  backLink: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  moreNote: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 18,
  },
  moreLink: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
});
