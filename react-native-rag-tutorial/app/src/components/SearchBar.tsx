import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { theme } from "../theme";

interface Props {
  onSubmit: (query: string) => void;
  loading: boolean;
}

export function SearchBar({ onSubmit, loading }: Props) {
  const [value, setValue] = useState("");

  const submit = () => {
    if (value.trim()) onSubmit(value);
  };

  return (
    <View style={styles.wrap}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={setValue}
        placeholder="Ask anything about Lumen Notes…"
        placeholderTextColor={theme.textMuted}
        returnKeyType="search"
        onSubmitEditing={submit}
        autoCapitalize="none"
        accessibilityLabel="Search query"
      />
      <Pressable
        accessibilityRole="button"
        onPress={submit}
        disabled={loading || !value.trim()}
        style={[styles.button, (loading || !value.trim()) && styles.buttonDisabled]}
      >
        <Text style={styles.buttonText}>{loading ? "…" : "Ask"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", gap: 10 },
  input: {
    flex: 1,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radius,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.text,
    fontSize: 16,
  },
  button: {
    backgroundColor: theme.accent,
    borderRadius: theme.radius,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
