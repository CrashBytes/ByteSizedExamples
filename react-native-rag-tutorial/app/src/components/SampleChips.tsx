import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { theme } from "../theme";

/** Tappable starter questions shown before the user has searched. */
export function SampleChips({ questions, onPick }: { questions: string[]; onPick: (q: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {questions.map((q) => (
        <Pressable key={q} onPress={() => onPick(q)} style={styles.chip} accessibilityRole="button">
          <Text style={styles.text}>{q}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4 },
  chip: {
    backgroundColor: theme.surfaceAlt,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  text: { color: theme.text, fontSize: 13 },
});
