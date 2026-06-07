import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, typography } from "../../theme";

interface Props {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionLabel, onAction }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={12}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingRight: 16,
  },
  title: { fontSize: 18, fontWeight: "700", color: colors.text, letterSpacing: -0.2 },
  action: { fontSize: 14, fontWeight: "600", color: colors.orange },
});
