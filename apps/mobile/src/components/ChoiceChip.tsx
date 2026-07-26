import { Pressable, StyleSheet, Text } from "react-native";

type ChoiceChipProps = {
  label: string;
  selected: boolean;
  onPress(): void;
};

export function ChoiceChip({ label, selected, onPress }: ChoiceChipProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selectedChip,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, selected && styles.selectedLabel]}>
        {selected ? "✓ " : ""}{label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#94a3b8",
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 52,
    minWidth: 92,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  selectedChip: {
    backgroundColor: "#0f766e",
    borderColor: "#0f766e",
  },
  pressed: {
    opacity: 0.72,
  },
  label: {
    color: "#334155",
    fontSize: 16,
    fontWeight: "700",
  },
  selectedLabel: {
    color: "#ffffff",
  },
});
