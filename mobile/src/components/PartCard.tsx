import React, { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import type { RootStackParamList } from "../navigation/types";
import type { Part } from "../types";
import { PartImageCarousel } from "./PartImageCarousel";
import { colors, radius, typography, CATEGORY_COLORS, spacing } from "../theme";
import { conditionLabel, formatPrice, getCategory } from "../utils/format";
import { storage } from "../storage";
import { openPartChat } from "../utils/chatNavigation";
import { showSellerContactMenu } from "../utils/sellerContact";

interface Props {
  part: Part;
  onPress: () => void;
  compact?: boolean;
}

export function PartCard({ part, onPress, compact }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const cat = getCategory(part.category);
  const catColor = CATEGORY_COLORS[part.category] || colors.orange;
  const images = part.images?.length ? part.images : part.image_url ? [part.image_url] : [];
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

  const onWriteSeller = () => {
    openPartChat(part, navigation);
  };

  const onMoreContact = () => {
    showSellerContactMenu(part, navigation);
  };

  const carouselHeight = compact ? 120 : 200;
  const listPad = spacing.md * 2;
  const compactWidth = 168;

  if (compact) {
    return (
      <View style={styles.compact}>
        <View style={styles.compactCarousel}>
          <PartImageCarousel
            images={images}
            fallbackAbbr={cat.abbr}
            fallbackColor={catColor}
            height={carouselHeight}
            width={compactWidth}
            showArrows={images.length > 1}
          />
          <Pressable style={styles.favBtn} onPress={toggleFav} hitSlop={10}>
            <Ionicons name={fav ? "heart" : "heart-outline"} size={16} color="#fff" />
          </Pressable>
        </View>
        <Pressable
          style={({ pressed }) => [styles.compactBody, pressed && styles.pressed]}
          onPress={onPress}
        >
          <View style={styles.topRow}>
            <Text style={[styles.badge, part.condition === "new" && styles.badgeNew]}>
              {conditionLabel(part.condition)}
            </Text>
            <Text style={styles.compactPrice}>{formatPrice(part.price)}</Text>
          </View>
          <Text style={styles.compactTitle} numberOfLines={2}>
            {part.title}
          </Text>
          <Pressable style={styles.writeBtnCompact} onPress={onWriteSeller}>
            <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.orange} />
          </Pressable>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.carouselWrap}>
        <PartImageCarousel
          images={images}
          fallbackAbbr={cat.abbr}
          fallbackColor={catColor}
          height={carouselHeight}
          horizontalPadding={listPad}
          showArrows
        />
        {part.verified ? (
          <View style={styles.verifiedBadge}>
            <Ionicons name="shield-checkmark" size={13} color="#fff" />
            <Text style={styles.verifiedText}>Проверено</Text>
          </View>
        ) : null}
        <Pressable style={styles.favBtn} onPress={toggleFav} hitSlop={10}>
          <Ionicons name={fav ? "heart" : "heart-outline"} size={20} color="#fff" />
        </Pressable>
      </View>

      <Pressable style={({ pressed }) => [styles.body, pressed && styles.pressed]} onPress={onPress}>
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
            OEM {part.part_number}
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          <Ionicons name="car-outline" size={14} color={colors.textMuted} />
          <Text style={styles.metaText} numberOfLines={1}>
            {part.car}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={14} color={colors.textMuted} />
          <Text style={styles.metaText} numberOfLines={1}>
            {part.location}
          </Text>
        </View>
        <View style={styles.bottomRow}>
          <View style={styles.sellerCol}>
            <Text style={styles.sellerLabel}>Продавец</Text>
            <Text style={styles.seller} numberOfLines={1}>
              {part.seller}
            </Text>
          </View>
          <Pressable style={styles.writeBtn} onPress={onWriteSeller}>
            <Ionicons name="chatbubble-ellipses" size={16} color="#fff" />
            <Text style={styles.writeBtnText}>В чат</Text>
          </Pressable>
          <Pressable style={styles.moreBtn} onPress={onMoreContact} hitSlop={8}>
            <Ionicons name="logo-whatsapp" size={18} color={colors.green} />
          </Pressable>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  compact: {
    width: 168,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginRight: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  pressed: { opacity: 0.94 },
  carouselWrap: { position: "relative" },
  compactCarousel: {
    position: "relative",
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    overflow: "hidden",
  },
  verifiedBadge: {
    position: "absolute",
    top: 10,
    right: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.verified,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  verifiedText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  favBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 18,
    padding: 7,
  },
  body: { padding: 14, gap: 6 },
  compactBody: { padding: 10, gap: 4 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    color: colors.used,
    backgroundColor: colors.borderLight,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    overflow: "hidden",
  },
  badgeNew: { color: colors.new, backgroundColor: "#E8F0FE" },
  title: { ...typography.body, fontWeight: "700", color: colors.text, lineHeight: 21 },
  compactTitle: { fontSize: 13, fontWeight: "600", color: colors.text, lineHeight: 18, minHeight: 36 },
  oem: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { flex: 1, fontSize: 13, color: colors.textSecondary },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  sellerCol: { flex: 1 },
  sellerLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 2 },
  seller: { fontSize: 14, color: colors.text, fontWeight: "700" },
  writeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.orange,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  writeBtnText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  moreBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
  writeBtnCompact: {
    alignSelf: "flex-start",
    marginTop: 4,
    padding: 4,
  },
  price: { ...typography.price, fontSize: 18, color: colors.orange },
  compactPrice: { fontSize: 14, fontWeight: "800", color: colors.orange },
});
