import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "../../theme";

type IconName = keyof typeof Ionicons.glyphMap;

interface Props {
  icon: IconName;
  label: string;
  subtitle?: string;
  onPress: () => void;
  iconBg?: string;
  iconColor?: string;
  danger?: boolean;
}

export function MenuRow({
  icon,
  label,
  subtitle,
  onPress,
  iconBg = colors.orangeSoft,
  iconColor = colors.orange,
  danger,
}: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.text}>
        <Text style={[styles.label, danger && styles.danger]}>{label}</Text>
        {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      </View>
      {!danger ? (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: 12,
  },
  pressed: { opacity: 0.7 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1 },
  label: { fontSize: 16, fontWeight: "600", color: colors.text },
  sub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  danger: { color: colors.danger },
});
