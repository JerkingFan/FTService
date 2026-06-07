import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { colors, radius, typography } from "../../theme";

type Variant = "primary" | "secondary" | "ghost" | "dark";

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export function Button({ label, onPress, variant = "primary", loading, style, icon }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" || variant === "dark" ? "#fff" : colors.orange} />
      ) : (
        <>
          {icon}
          <Text style={[styles.label, styles[`label_${variant}`]]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: radius.md,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  primary: { backgroundColor: colors.orange },
  secondary: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.orange },
  ghost: { backgroundColor: colors.orangeSoft },
  dark: { backgroundColor: colors.text },
  label: { ...typography.caption, fontWeight: "700", fontSize: 15 },
  label_primary: { color: "#fff" },
  label_secondary: { color: colors.orange },
  label_ghost: { color: colors.orange },
  label_dark: { color: "#fff" },
});
