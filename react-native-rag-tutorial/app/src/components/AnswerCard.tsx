import { StyleSheet, Text, View } from "react-native";
import type { RagAnswer } from "@cb/rag-core";
import { theme } from "../theme";

/**
 * Renders a grounded answer plus its sources. The same component handles both
 * modes: an extractive on-device answer and a Claude-written cloud answer have
 * the same `RagAnswer` shape, so there is nothing mode-specific here.
 */
export function AnswerCard({ answer }: { answer: RagAnswer }) {
  return (
    <View style={styles.card}>
      <Text style={styles.answer}>{answer.answer}</Text>

      {answer.citations.length > 0 && (
        <View style={styles.sources}>
          <Text style={styles.sourcesTitle}>Sources</Text>
          {answer.citations.map((c) => (
            <View key={c.chunkId} style={styles.source}>
              <Text style={styles.marker}>[{c.marker}]</Text>
              <View style={styles.sourceBody}>
                <Text style={styles.sourceTitle}>{String(c.metadata?.["title"] ?? c.docId)}</Text>
                <Text style={styles.snippet} numberOfLines={2}>
                  {c.snippet}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.meta}>
        {answer.meta.embedder} · {answer.meta.synthesizer} · {answer.meta.retrievedCount} passages ·{" "}
        {answer.meta.durationMs}ms
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.surface,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.border,
    padding: theme.space,
    gap: 14,
  },
  answer: { color: theme.text, fontSize: 16, lineHeight: 24 },
  sources: { gap: 10, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 12 },
  sourcesTitle: { color: theme.textMuted, fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
  source: { flexDirection: "row", gap: 8 },
  marker: { color: theme.accent, fontWeight: "700", fontSize: 14 },
  sourceBody: { flex: 1 },
  sourceTitle: { color: theme.text, fontWeight: "600", fontSize: 14 },
  snippet: { color: theme.textMuted, fontSize: 13, marginTop: 2, lineHeight: 18 },
  meta: { color: theme.textMuted, fontSize: 11, fontFamily: "monospace" },
});
