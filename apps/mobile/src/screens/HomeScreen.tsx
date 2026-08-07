import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { api, ApiError } from "../api/client";

type Status = "checking" | "online" | "offline";

export default function HomeScreen() {
  const [status, setStatus] = useState<Status>("checking");
  const [detail, setDetail] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);

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
  }, [checkHealth]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await checkHealth();
    setRefreshing(false);
  }, [checkHealth]);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>AI Rights Coach</Text>
      <Text style={styles.subtitle}>
        Understand your rights. Explain your documents. Draft your reply.
      </Text>

      <View style={styles.statusBox}>
        {status === "checking" && <ActivityIndicator />}
        {status !== "checking" && (
          <View style={[styles.dot, status === "online" ? styles.dotOnline : styles.dotOffline]} />
        )}
        <Text style={styles.statusText}>
          Backend: {status === "checking" ? "checking…" : status}
        </Text>
      </View>
      {detail ? <Text style={styles.detailText}>{detail}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    opacity: 0.7,
    marginBottom: 24,
  },
  statusBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotOnline: {
    backgroundColor: "#22c55e",
  },
  dotOffline: {
    backgroundColor: "#ef4444",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  detailText: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 4,
  },
});
