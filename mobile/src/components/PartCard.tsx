import React, { useEffect, useState } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Part } from "../types";
import { colors, radius, typography, CATEGORY_COLORS } from "../theme";
import { conditionLabel, formatPrice } from "../utils/format";
import { getCategory } from "../utils/format";
import { storage } from "../storage";

interface Props {
  part: Part;
  onPress: () => void;
  compact?: boolean;
}

export function PartCard({ part, onPress, compact }: Props) {
  const cat = getCategory(part.category);
  const catColor = CATEGORY_COLORS[part.category] || colors.orange;
  const images = part.images?.length ? part.images : part.image_url ? [part.image_url] : [];
  const cover = images[0] || null;
  const photoCount = images.length;
  const [fav, setFav] = useState(false);

  useEffect(() => {
    let alive = true;
    storage.isFavoritePart(part.id).then((v) => alive && setFav(v));
    return () => {
      alive = false;
    };
  }, [part.id]);

  const toggleFav = async () => {
    const next = await storage.toggleFavoritePart(part.id);
    setFav(next);
  };

  if (compact) {
    return (
      <Pressable
        style={({ pressed }) => [styles.compact, pressed && styles.pressed]}
        onPress={onPress}
      >
        <View style={[styles.thumb, { backgroundColor: catColor }]}>
          {cover ? (
            <Image source={{ uri: cover }} style={styles.cover} />
          ) : (
            <Text style={styles.thumbAbbr}>{cat.abbr}</Text>
          )}
          <Pressable style={styles.favBtnCompact} onPress={toggleFav} hitSlop={10}>
            <Ionicons name={fav ? "heart" : "heart-outline"} size={18} color="#fff" />
          </Pressable>
        </View>
        <View style={styles.compactBody}>
          <View style={styles.badgeRow}>
            <Text style={[styles.badge, part.condition === "new" && styles.badgeNew]}>
              {conditionLabel(part.condition)}
            </Text>
          </View>
          <Text style={styles.compactTitle} numberOfLines={2}>
            {part.title}
          </Text>
          <Text style={styles.compactPrice}>{formatPrice(part.price)}</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={[styles.thumbLg, { backgroundColor: catColor }]}>
        {cover ? (
          <Image source={{ uri: cover }} style={styles.coverLg} resizeMode="cover" />
        ) : (
          <Text style={styles.thumbAbbrLg}>{cat.abbr}</Text>
        )}
        {photoCount > 1 ? (
          <View style={styles.photoBadge}>
            <Ionicons name="images-outline" size={11} color="#fff" />
            <Text style={styles.photoBadgeText}>{photoCount}</Text>
          </View>
        ) : null}
        {part.verified ? (
          <View style={styles.verifiedDot}>
            <Ionicons name="shield-checkmark" size={14} color="#fff" />
          </View>
        ) : null}
        <Pressable style={styles.favBtn} onPress={toggleFav} hitSlop={10}>
          <Ionicons name={fav ? "heart" : "heart-outline"} size={18} color="#fff" />
        </Pressable>
      </View>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={[styles.badge, part.condition === "new" && styles.badgeNew]}>
            {conditionLabel(part.condition)}
          </Text>
          <Text style={styles.price}>{formatPrice(part.price)}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {part.title}
        </Text>
        {part.part_number ? (
          <Text style={styles.oem} numberOfLines={1}>
            {part.part_number}
          </Text>
        ) : null}
        <Text style={styles.metaLine} numberOfLines={1}>
          {part.car} · {part.location}
        </Text>
        <View style={styles.bottomRow}>
          <Text style={styles.seller} numberOfLines={1}>
            {part.seller}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.border} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  compact: {
    width: 156,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginRight: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  pressed: { opacity: 0.92 },
  thumb: { height: 88, alignItems: "center", justifyContent: "center" },
  thumbLg: {
    width: 100,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  cover: { width: "100%", height: "100%", resizeMode: "cover" as const },
  coverLg: { width: "100%", height: "100%" },
  thumbAbbr: { color: "rgba(255,255,255,0.9)", fontSize: 18, fontWeight: "800" },
  thumbAbbrLg: { color: "rgba(255,255,255,0.9)", fontSize: 22, fontWeight: "800" },
  photoBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  photoBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  verifiedDot: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: colors.verified,
    borderRadius: 10,
    padding: 3,
  },
  favBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.22)",
    borderRadius: 14,
    padding: 6,
  },
  favBtnCompact: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.22)",
    borderRadius: 14,
    padding: 6,
  },
  compactBody: { padding: 10 },
  body: { flex: 1, padding: 12, paddingLeft: 12, justifyContent: "space-between" },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  badgeRow: { marginBottom: 4 },
  badge: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    color: colors.used,
    backgroundColor: colors.borderLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  badgeNew: { color: colors.new, backgroundColor: "#E8F0FE" },
  title: { ...typography.body, fontWeight: "600", color: colors.text, marginBottom: 4 },
  compactTitle: { fontSize: 13, fontWeight: "600", color: colors.text, lineHeight: 18, minHeight: 36 },
  oem: { fontSize: 12, color: colors.textMuted, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", marginBottom: 4 },
  metaLine: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  bottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  seller: { flex: 1, fontSize: 12, color: colors.textSecondary, fontWeight: "600", marginRight: 8 },
  price: { ...typography.price, fontSize: 17, color: colors.orange },
  compactPrice: { fontSize: 15, fontWeight: "800", color: colors.orange, marginTop: 4 },
});
