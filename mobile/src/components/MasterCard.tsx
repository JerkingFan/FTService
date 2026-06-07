import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Master } from "../types";
import { colors, radius, shadow, spacing, typography } from "../theme";
import { formatPrice } from "../utils/format";
import { storage } from "../storage";

interface Props {
  master: Master;
  onPress: () => void;
}

export function MasterCard({ master, onPress }: Props) {
  const initials = master.name
    .replace(/\./g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  const [fav, setFav] = useState(false);
  useEffect(() => {
    let alive = true;
    storage.isFavoriteMaster(master.id).then((v) => alive && setFav(v));
    return () => {
      alive = false;
    };
  }, [master.id]);

  const toggleFav = async (e?: { stopPropagation?: () => void }) => {
    e?.stopPropagation?.();
    const next = await storage.toggleFavoriteMaster(master.id);
    setFav(next);
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.top}>
          <Text style={styles.name} numberOfLines={1}>
            {master.name}
          </Text>
          <View style={styles.rating}>
            <Ionicons name="star" size={12} color={colors.star} />
            <Text style={styles.ratingText}>{master.rating}</Text>
          </View>
        </View>
        <Text style={styles.spec} numberOfLines={1}>
          {master.spec}
        </Text>
        <View style={styles.bottom}>
          <View style={styles.loc}>
            <Ionicons name="location-outline" size={13} color={colors.textMuted} />
            <Text style={styles.locText} numberOfLines={1}>
              {master.district}
              {master.distance_km != null ? ` · ${master.distance_km} км` : ""}
            </Text>
          </View>
          <Text style={styles.price}>от {formatPrice(master.priceFrom)}</Text>
        </View>
      </View>

      <Pressable style={styles.fav} onPress={() => toggleFav()} hitSlop={8}>
        <Ionicons
          name={fav ? "heart" : "heart-outline"}
          size={20}
          color={fav ? colors.orange : colors.textMuted}
        />
      </Pressable>

      <Ionicons name="chevron-forward" size={18} color={colors.border} style={styles.chev} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 10,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadow.card,
  },
  pressed: { opacity: 0.94 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.orangeSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.orange, fontWeight: "800", fontSize: 16 },
  body: { flex: 1, marginLeft: 12, marginRight: 8 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  name: { ...typography.h2, fontSize: 15, flex: 1, marginRight: 8 },
  rating: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingText: { fontSize: 13, fontWeight: "700", color: colors.text },
  spec: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  bottom: { marginTop: 8 },
  loc: { flexDirection: "row", alignItems: "center", gap: 4 },
  locText: { flex: 1, fontSize: 12, color: colors.textMuted },
  price: { fontSize: 14, fontWeight: "700", color: colors.orange, marginTop: 4 },
  fav: { padding: 4 },
  chev: { marginLeft: 2 },
});
