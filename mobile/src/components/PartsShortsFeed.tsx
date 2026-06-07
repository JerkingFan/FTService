import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../api";
import type { RootStackParamList, TabParamList } from "../navigation/types";
import type { Part } from "../types";
import type { PartsFeedQuery } from "../types/feedQuery";
import { feedQueryKey, toApiParams } from "../types/feedQuery";
import { storage } from "../storage";
import { colors, radius } from "../theme";
import { conditionLabel, formatPrice } from "../utils/format";
import { partImages } from "../utils/stockImages";

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: Nav;
  query: PartsFeedQuery;
  /** На весь экран (экран категории в стеке, без таб-бара) */
  fullscreen?: boolean;
  /** Отступ снизу (высота таб-бара), если лента внутри табов */
  bottomOffset?: number;
}

const DEFAULT_TAB_BAR = 56;

export function PartsShortsFeed({
  navigation,
  query,
  fullscreen = true,
  bottomOffset = 0,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width, height: windowH } = Dimensions.get("window");
  const pageHeight = Math.max(
    1,
    fullscreen ? windowH : windowH - (bottomOffset || DEFAULT_TAB_BAR)
  );

  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<Part>>(null);
  const queryKey = feedQueryKey(query);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getParts(toApiParams(query));
      setParts(data.filter((p) => partImages(p).length > 0));
      setActiveIndex(0);
      requestAnimationFrame(() => {
        listRef.current?.scrollToOffset({ offset: 0, animated: false });
      });
    } catch {
      setParts([]);
    } finally {
      setLoading(false);
    }
  }, [queryKey]);

  useEffect(() => {
    load();
  }, [load]);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const top = viewableItems.find((v) => v.isViewable);
    if (top?.index != null) {
      setActiveIndex(top.index);
      const p = top.item as Part;
      if (p?.id) storage.addViewedPart(p.id).catch(() => {});
    }
  }, []);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  if (loading) {
    return (
      <View style={[styles.center, { height: pageHeight }]}>
        <ActivityIndicator size="large" color={colors.orange} />
      </View>
    );
  }

  if (parts.length === 0) {
    return (
      <View style={[styles.center, { height: pageHeight }]}>
        <Ionicons name="images-outline" size={48} color={colors.textMuted} />
        <Text style={styles.emptyText}>Нет объявлений</Text>
        <Text style={styles.emptySub}>Попробуйте другой поиск или сбросьте фильтры</Text>
      </View>
    );
  }

  return (
    <FlatList
      ref={listRef}
      data={parts}
      keyExtractor={(p) => String(p.id)}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={pageHeight}
      snapToAlignment="start"
      disableIntervalMomentum
      removeClippedSubviews={false}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      getItemLayout={(_, index) => ({ length: pageHeight, offset: pageHeight * index, index })}
      onScrollToIndexFailed={() => {}}
      renderItem={({ item, index }) => (
        <ShortCard
          part={item}
          pageWidth={width}
          pageHeight={pageHeight}
          isActive={index === activeIndex}
          topInset={insets.top}
          onOpenDetail={() => navigation.navigate("PartDetail", { id: item.id })}
        />
      )}
    />
  );
}

function ShortCard({
  part,
  pageWidth,
  pageHeight,
  isActive,
  topInset,
  onOpenDetail,
}: {
  part: Part;
  pageWidth: number;
  pageHeight: number;
  isActive: boolean;
  topInset: number;
  onOpenDetail: () => void;
}) {
  const images = partImages(part);
  const listRef = useRef<FlatList<string>>(null);
  const [imgIndex, setImgIndex] = useState(0);
  const [fav, setFav] = useState(false);

  useEffect(() => {
    storage.isFavoritePart(part.id).then(setFav);
  }, [part.id]);

  useEffect(() => {
    if (!isActive) return;
    setImgIndex(0);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [isActive, part.id]);

  const toggleFav = async () => {
    const next = await storage.toggleFavoritePart(part.id);
    setFav(next);
  };

  const onHorizontalEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    setImgIndex(next);
  };

  return (
    <View style={{ width: pageWidth, height: pageHeight, backgroundColor: "#000" }}>
      <FlatList
        ref={listRef}
        data={images}
        horizontal
        pagingEnabled
        nestedScrollEnabled
        removeClippedSubviews={false}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        keyExtractor={(u, i) => `${part.id}_${i}`}
        getItemLayout={(_, index) => ({ length: pageWidth, offset: pageWidth * index, index })}
        onMomentumScrollEnd={onHorizontalEnd}
        renderItem={({ item }) => (
          <Pressable style={{ width: pageWidth, height: pageHeight }} onPress={onOpenDetail}>
            <Image source={{ uri: item }} style={styles.photo} resizeMode="cover" />
          </Pressable>
        )}
      />

      <View style={[styles.gradientTop, { height: topInset + 100 }]} pointerEvents="none" />
      <View style={styles.gradientBottom} pointerEvents="none" />

      {images.length > 1 ? (
        <View style={styles.dots}>
          {images.map((_, i) => (
            <View key={String(i)} style={[styles.dot, i === imgIndex && styles.dotActive]} />
          ))}
        </View>
      ) : null}

      <View style={styles.sideActions}>
        <Pressable style={styles.actionBtn} onPress={toggleFav}>
          <Ionicons name={fav ? "heart" : "heart-outline"} size={28} color={fav ? colors.red : "#fff"} />
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={onOpenDetail}>
          <Ionicons name="information-circle-outline" size={30} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.bottomInfo}>
        <Text style={styles.hint}>← → фото · ↑ ↓ объявления · нажмите — подробнее</Text>
        <View style={styles.badgeRow}>
          <Text style={styles.badge}>
            {part.condition === "new" || part.condition === "used"
              ? conditionLabel(part.condition)
              : "Б/У"}
          </Text>
          {part.verified ? (
            <View style={styles.verified}>
              <Ionicons name="shield-checkmark" size={12} color="#fff" />
              <Text style={styles.verifiedText}>Проверено</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {part.title}
        </Text>
        <Text style={styles.price}>{formatPrice(part.price)}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {part.car} · {part.location}
        </Text>
        <Pressable style={styles.detailBtn} onPress={onOpenDetail}>
          <Text style={styles.detailBtnText}>Подробнее</Text>
          <Ionicons name="chevron-forward" size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", backgroundColor: "#000", gap: 10 },
  emptyText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  emptySub: { color: colors.textMuted, fontSize: 14, textAlign: "center", paddingHorizontal: 32 },
  photo: { width: "100%", height: "100%" },
  gradientTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  gradientBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 280,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  dots: {
    position: "absolute",
    top: "42%",
    right: 12,
    gap: 6,
    alignItems: "center",
  },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.4)" },
  dotActive: { height: 16, backgroundColor: "#fff" },
  sideActions: {
    position: "absolute",
    right: 12,
    bottom: 200,
    gap: 16,
    alignItems: "center",
  },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomInfo: {
    position: "absolute",
    left: 16,
    right: 72,
    bottom: 24,
  },
  hint: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 10,
  },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  badge: {
    fontSize: 11,
    fontWeight: "800",
    color: "#fff",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: "hidden",
  },
  verified: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.green,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  title: { color: "#fff", fontSize: 18, fontWeight: "800", marginBottom: 4 },
  price: { color: colors.orange, fontSize: 26, fontWeight: "800", marginBottom: 4 },
  meta: { color: "rgba(255,255,255,0.75)", fontSize: 13, marginBottom: 12 },
  detailBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    backgroundColor: colors.orange,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.full,
  },
  detailBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
