import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { DEMO_MODE } from "../config";
import { colors, spacing } from "../theme";

export function DemoBanner() {
  if (!DEMO_MODE) return null;
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>Демо-версия · данные без сервера</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.orangeLight,
    borderBottomWidth: 2,
    borderBottomColor: colors.orange,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.orange,
    textAlign: "center",
  },
});
