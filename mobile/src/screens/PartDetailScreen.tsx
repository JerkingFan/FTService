import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../api";
import { storage } from "../storage";
import type { RootStackParamList } from "../navigation/types";
import type { AppConfig, Part } from "../types";
import { colors, radius, shadow, spacing, typography, CATEGORY_COLORS } from "../theme";
import { PartImageCarousel } from "../components/PartImageCarousel";
import { CATEGORY_NAMES, conditionLabel, formatPrice, getCategory } from "../utils/format";
import {
  callSellerPhone,
  openTelegramForPart,
  openWhatsAppForPart,
  showSellerContactMenu,
} from "../utils/sellerContact";
import { openPartChat } from "../utils/chatNavigation";

type Route = RouteProp<RootStackParamList, "PartDetail">;

interface Props {
  route: Route;
}

export function PartDetailScreen({ route }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [part, setPart] = useState<Part | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    storage.addViewedPart(route.params.id).catch(() => {});
  }, [route.params.id]);

  useEffect(() => {
    Promise.all([api.getPart(route.params.id), api.getConfig()])
      .then(([p, c]) => {
        setPart(p);
        setConfig(c);
      })
      .catch(() => setPart(null))
      .finally(() => setLoading(false));
  }, [route.params.id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.orange} size="large" />
      </View>
    );
  }

  if (!part) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.border} />
        <Text style={styles.notFound}>Объявление не найдено</Text>
      </View>
    );
  }

  const catColor = CATEGORY_COLORS[part.category] || colors.orange;
  const cat = getCategory(part.category);
  const images = (part.images && part.images.length ? part.images : part.image_url ? [part.image_url] : []) as string[];
  const { width: screenW, height: screenH } = Dimensions.get("window");
  const galleryHeight = Math.round(Math.min(screenW * 0.78, screenH * 0.48));

  return (
    <View style={styles.wrap}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.gallery, { height: galleryHeight, backgroundColor: catColor }]}>
          {images.length > 0 ? (
            <PartImageCarousel
              images={images}
              fallbackAbbr={cat.abbr}
              fallbackColor={catColor}
              height={galleryHeight}
              width={screenW}
              showArrows
            />
          ) : (
            <Text style={styles.heroAbbr}>{cat.abbr}</Text>
          )}
          {part.verified ? (
            <View style={styles.verifiedPill}>
              <Ionicons name="shield-checkmark" size={14} color="#fff" />
              <Text style={styles.verifiedText}>Проверено</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <View style={styles.badgeRow}>
            <Text style={[styles.badge, part.condition === "new" && styles.badgeNew]}>
              {conditionLabel(part.condition)}
            </Text>
            <Text style={styles.cat}>{CATEGORY_NAMES[part.category] || part.category}</Text>
          </View>

          <Text style={styles.title}>{part.title}</Text>
          <Text style={styles.price}>{formatPrice(part.price)}</Text>

          {part.part_number ? (
            <View style={styles.oemBox}>
              <Text style={styles.oemLabel}>Номер запчасти</Text>
              <Text style={styles.oemValue}>{part.part_number}</Text>
            </View>
          ) : null}

          <View style={styles.infoRow}>
            <Ionicons name="car-outline" size={18} color={colors.textMuted} />
            <Text style={styles.infoText}>{part.car}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color={colors.textMuted} />
            <Text style={styles.infoText}>{part.location}</Text>
          </View>

          {part.description ? (
            <View style={styles.block}>
              <Text style={styles.blockTitle}>Описание</Text>
              <Text style={styles.desc}>{part.description}</Text>
            </View>
          ) : null}

          {part.attributes && Object.keys(part.attributes).length > 0 ? (
            <View style={styles.block}>
              <Text style={styles.blockTitle}>Характеристики</Text>
              <View style={styles.attrs}>
                {Object.entries(part.attributes).map(([k, v]) => (
                  <View key={k} style={styles.attrRow}>
                    <Text style={styles.attrKey}>{k}</Text>
                    <Text style={styles.attrVal}>{v}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {part.fits?.length > 0 && (
            <View style={styles.block}>
              <Text style={styles.blockTitle}>Подходит для</Text>
              <View style={styles.chips}>
                {part.fits.map((f) => (
                  <View key={f} style={styles.chip}>
                    <Text style={styles.chipText}>{f}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.sellerCard}>
            <Text style={styles.blockTitle}>Продавец</Text>
            <Text style={styles.sellerName}>{part.seller}</Text>
            {part.phone ? (
              <TouchableOpacity
                style={styles.phoneRow}
                onPress={() => part && callSellerPhone(part).catch(() => {})}
              >
                <Ionicons name="call-outline" size={18} color={colors.orange} />
                <Text style={styles.phone}>{part.phone}</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.writeSellerBtn}
              onPress={() => part && openPartChat(part, navigation)}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
              <Text style={styles.writeSellerBtnText}>Написать в чате</Text>
            </TouchableOpacity>
            {part.working_hours ? (
              <View style={styles.metaLine}>
                <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                <Text style={styles.metaText}>{part.working_hours}</Text>
              </View>
            ) : null}
            {part.address ? (
              <View style={styles.metaLine}>
                <Ionicons name="location-outline" size={16} color={colors.textMuted} />
                <Text style={styles.metaText}>{part.address}</Text>
              </View>
            ) : null}
          </View>

          {config?.return_days ? (
            <Text style={styles.returnNote}>Возврат в течение {config.return_days} дней</Text>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity
          style={[styles.contactBtn, styles.waBtn]}
          onPress={() => openWhatsAppForPart(part).catch(() => {})}
        >
          <Ionicons name="logo-whatsapp" size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.contactBtn, styles.tgBtn]}
          onPress={() => openTelegramForPart(part).catch(() => {})}
        >
          <Ionicons name="paper-plane" size={20} color="#fff" />
        </TouchableOpacity>
        {part.phone ? (
          <TouchableOpacity
            style={[styles.contactBtn, styles.callBtn]}
            onPress={() => callSellerPhone(part).catch(() => {})}
          >
            <Ionicons name="call" size={22} color="#fff" />
            <Text style={styles.callLabel}>Позвонить</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.contactBtn, styles.callBtn, { flex: 1 }]}
            onPress={() => showSellerContactMenu(part, navigation)}
          >
            <Text style={styles.callLabel}>Написать</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { paddingBottom: 24 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: colors.bg },
  notFound: { ...typography.h2, color: colors.textMuted },
  gallery: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    backgroundColor: colors.bg,
  },
  galleryImg: { width: "100%", height: "100%" },
  heroAbbr: { fontSize: 48, fontWeight: "800", color: "rgba(255,255,255,0.9)" },
  photoCounter: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  photoCounterText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  dots: {
    position: "absolute",
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.5)" },
  dotActive: { backgroundColor: "#fff", width: 20 },
  verifiedPill: {
    position: "absolute",
    bottom: 14,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  verifiedText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  body: {
    padding: spacing.md,
    paddingTop: spacing.md + 4,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
  },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  badge: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    color: colors.used,
    backgroundColor: colors.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeNew: { color: colors.new, backgroundColor: "#E8F0FE" },
  cat: { fontSize: 13, color: colors.textMuted, fontWeight: "600" },
  title: { ...typography.h1, color: colors.text, marginBottom: 6 },
  price: { fontSize: 32, fontWeight: "800", color: colors.orange, marginBottom: spacing.md },
  oemBox: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: spacing.md,
  },
  oemLabel: { fontSize: 11, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", marginBottom: 4 },
  oemValue: { fontSize: 16, fontWeight: "700", color: colors.text, fontFamily: "monospace" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  infoText: { flex: 1, fontSize: 15, color: colors.textSecondary },
  block: { marginTop: spacing.md },
  blockTitle: { ...typography.h2, fontSize: 15, color: colors.text, marginBottom: 8 },
  desc: { ...typography.body, color: colors.textSecondary },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    backgroundColor: colors.orangeSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.orangeMuted,
  },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.orangeDark },
  attrs: { gap: 8 },
  attrRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  attrKey: { flex: 1, fontSize: 13, color: colors.textMuted, fontWeight: "600" },
  attrVal: { flex: 1, fontSize: 13, color: colors.textSecondary, fontWeight: "600", textAlign: "right" },
  sellerCard: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sellerName: { fontSize: 17, fontWeight: "700", color: colors.text },
  phoneRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  phone: { fontSize: 16, fontWeight: "600", color: colors.orange },
  writeSellerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    backgroundColor: colors.orange,
    borderRadius: radius.md,
    paddingVertical: 12,
  },
  writeSellerBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  metaLine: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  metaText: { flex: 1, fontSize: 14, color: colors.textSecondary },
  returnNote: { textAlign: "center", marginTop: spacing.lg, fontSize: 13, color: colors.textMuted },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    ...shadow.float,
  },
  contactBtn: {
    height: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  waBtn: { width: 52, backgroundColor: colors.green },
  tgBtn: { width: 52, backgroundColor: colors.telegram },
  callBtn: { flex: 1, backgroundColor: colors.orange },
  callLabel: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
