import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../theme";

export function Header() {
  return (
    <View style={styles.wrap}>
      <View style={styles.mark}>
        <Text style={styles.markText}>FT</Text>
      </View>
      <Text style={styles.title}>
        FT<Text style={styles.accent}>service</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: spacing.sm,
  },
  mark: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  markText: { color: colors.white, fontWeight: "800", fontSize: 16 },
  title: { fontSize: 22, fontWeight: "800", color: colors.text },
  accent: { color: colors.orange },
});
