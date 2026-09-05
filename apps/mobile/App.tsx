import { Component, ErrorInfo, ReactNode, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import HomeScreen from "./src/screens/HomeScreen";
import DocumentReviewScreen from "./src/screens/DocumentReviewScreen";
import DraftResponseScreen from "./src/screens/DraftResponseScreen";

type Screen = "Home" | "Review" | "Draft";

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
        <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
          <Text style={{ fontWeight: "700", fontSize: 18, marginBottom: 8 }}>
            Something crashed while rendering
          </Text>
          <Text selectable style={{ fontSize: 13, color: "#b91c1c" }}>
            {this.state.error.name}: {this.state.error.message}
          </Text>
          <Text selectable style={{ fontSize: 11, color: "#666", marginTop: 12 }}>
            {this.state.error.stack}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("Home");

  return (
    <ErrorBoundary>
      <View style={styles.root}>
        {screen !== "Home" && (
          <Pressable style={styles.backBtn} onPress={() => setScreen("Home")}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
        )}
        {screen === "Home" && (
          <HomeScreen
            onOpenReview={() => setScreen("Review")}
            onOpenDraft={() => setScreen("Draft")}
          />
        )}
        {screen === "Review" && <DocumentReviewScreen />}
        {screen === "Draft" && <DraftResponseScreen />}
      </View>
      <StatusBar style="auto" />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backBtn: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    alignSelf: "flex-start",
  },
  backText: {
    fontSize: 15,
    color: "#2563eb",
    fontWeight: "600",
  },
});
