import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "../theme";
import { CATEGORIES } from "../utils/format";

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  all: "apps-outline",
  engine: "speedometer-outline",
  electrical: "flash-outline",
  body: "car-sport-outline",
  brakes: "disc-outline",
  suspension: "git-compare-outline",
  cooling: "snow-outline",
  transmission: "swap-horizontal-outline",
  wheels: "ellipse-outline",
  tires: "disc-outline",
  interior: "car-outline",
};

interface Props {
  onCategory: (categoryId: string) => void;
  title?: string;
}

export function CategoryGridSection({ onCategory, title = "Категории" }: Props) {
  const cats = useMemo(() => CATEGORIES.filter((c) => c.id !== "all"), []);
  const rows = useMemo(() => {
    const out: (typeof cats)[] = [];
    for (let i = 0; i < cats.length; i += 2) {
      out.push(cats.slice(i, i + 2));
    }
    return out;
  }, [cats]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {rows.map((row) => (
        <View key={row[0].id} style={styles.row}>
          {row.map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
              onPress={() => onCategory(item.id)}
            >
              <View style={styles.tileImage}>
                <Ionicons name={ICONS[item.id] ?? "pricetags-outline"} size={36} color={colors.textSecondary} />
              </View>
              <Text style={styles.tileLabel} numberOfLines={2}>
                {item.name}
              </Text>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.md, marginTop: spacing.md },
  title: {
    ...typography.h2,
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  row: { flexDirection: "row", gap: 10, marginBottom: 10 },
  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: "hidden",
    minHeight: 140,
  },
  pressed: { opacity: 0.9 },
  tileImage: {
    height: 96,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
  tileLabel: {
    padding: 12,
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
});
