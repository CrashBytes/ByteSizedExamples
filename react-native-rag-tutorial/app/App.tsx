import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native";
import { theme } from "./src/theme";
import { useRagSearch, type RagMode } from "./src/hooks/useRagSearch";
import { ModeToggle } from "./src/components/ModeToggle";
import { SearchBar } from "./src/components/SearchBar";
import { AnswerCard } from "./src/components/AnswerCard";
import { SampleChips } from "./src/components/SampleChips";
import { remoteBaseUrl } from "./src/rag/remoteClient";
import { SAMPLE_QUESTIONS } from "./src/data/knowledgeBase";

/**
 * Lumen RAG — a single-screen demo of Retrieval-Augmented Generation in React
 * Native. Type a question; the answer is grounded in the bundled help center and
 * every claim is cited. Toggle between fully on-device retrieval (private,
 * offline, lexical) and cloud retrieval (Voyage embeddings + Claude synthesis).
 */
export default function App() {
  const [mode, setMode] = useState<RagMode>("on-device");
  const { loading, answer, error, search, reset } = useRagSearch();

  const onPick = (q: string) => search(q, mode);
  const onModeChange = (m: RagMode) => {
    setMode(m);
    reset();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Ask Lumen</Text>
          <Text style={styles.subtitle}>
            Retrieval-Augmented answers over your help center — grounded and cited.
          </Text>

          <ModeToggle mode={mode} onChange={onModeChange} />

          {mode === "cloud" && (
            <Text style={styles.hint}>Cloud mode calls {remoteBaseUrl()}</Text>
          )}

          <SearchBar onSubmit={(q) => search(q, mode)} loading={loading} />

          {!answer && !loading && <SampleChips questions={SAMPLE_QUESTIONS} onPick={onPick} />}

          {loading && (
            <View style={styles.center}>
              <ActivityIndicator color={theme.accent} />
              <Text style={styles.muted}>
                {mode === "cloud" ? "Retrieving and asking Claude…" : "Searching on device…"}
              </Text>
            </View>
          )}

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              {mode === "cloud" && (
                <Text style={styles.muted}>
                  Start the server with `npm run dev:server` and set EXPO_PUBLIC_RAG_API_URL to your
                  machine's LAN IP when testing on a physical device.
                </Text>
              )}
            </View>
          )}

          {answer && <AnswerCard answer={answer} />}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  flex: { flex: 1 },
  content: { padding: theme.space, gap: theme.space },
  title: { color: theme.text, fontSize: 30, fontWeight: "800" },
  subtitle: { color: theme.textMuted, fontSize: 15, lineHeight: 21, marginTop: -8 },
  hint: { color: theme.textMuted, fontSize: 12, fontFamily: "monospace" },
  center: { alignItems: "center", gap: 10, paddingVertical: 24 },
  muted: { color: theme.textMuted, fontSize: 13, textAlign: "center" },
  errorBox: {
    backgroundColor: "#2A1622",
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: "#5A2740",
    padding: theme.space,
    gap: 8,
  },
  errorText: { color: "#FF9BB3", fontSize: 14 },
});
