import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors, radius } from "../../theme";

interface Props {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

export function Chip({ label, active, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && styles.active,
        pressed && onPress && styles.pressed,
      ]}
    >
      <Text style={[styles.text, active && styles.textActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginRight: 8,
  },
  active: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  pressed: { opacity: 0.85 },
  text: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  textActive: { color: "#fff" },
});
