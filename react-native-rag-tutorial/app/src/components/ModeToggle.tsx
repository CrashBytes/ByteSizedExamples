import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../theme";
import type { RagMode } from "../hooks/useRagSearch";

interface Props {
  mode: RagMode;
  onChange: (mode: RagMode) => void;
}

/** Segmented control switching between on-device and cloud retrieval. */
export function ModeToggle({ mode, onChange }: Props) {
  return (
    <View style={styles.row}>
      <Segment label="On-device" sub="private · offline" active={mode === "on-device"} onPress={() => onChange("on-device")} />
      <Segment label="Cloud" sub="Voyage + Claude" active={mode === "cloud"} onPress={() => onChange("cloud")} />
    </View>
  );
}

function Segment({ label, sub, active, onPress }: { label: string; sub: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.segment, active && styles.segmentActive]}
    >
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
      <Text style={[styles.sub, active && styles.subActive]}>{sub}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    backgroundColor: theme.surface,
    borderRadius: theme.radius,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: theme.border,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: theme.radius - 4,
    alignItems: "center",
  },
  segmentActive: { backgroundColor: theme.accentSoft },
  label: { color: theme.textMuted, fontWeight: "600", fontSize: 15 },
  labelActive: { color: theme.text },
  sub: { color: theme.textMuted, fontSize: 11, marginTop: 2 },
  subActive: { color: theme.accent },
});
