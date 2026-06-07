import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../api";
import { PartCard } from "../components/PartCard";
import { Chip } from "../components/ui/Chip";
import { EMPTY_FILTERS, FiltersModal, type FilterValues } from "../components/FiltersModal";
import type { RootStackParamList } from "../navigation/types";
import type { Part } from "../types";
import { toApiParams } from "../types/feedQuery";
import { storage } from "../storage";
import { colors, radius, spacing, typography } from "../theme";
import { CATEGORIES, getCategory } from "../utils/format";

type Nav = NativeStackNavigationProp<RootStackParamList, "Parts">;
type PartsRoute = RouteProp<RootStackParamList, "Parts">;

interface Props {
  navigation: Nav;
  route: PartsRoute;
}

export function PartsFeedScreen({ navigation, route }: Props) {
  const initialCategory = route.params?.category ?? "all";
  const [category, setCategory] = useState(initialCategory);
  const [q, setQ] = useState(route.params?.q ?? "");
  const [oem, setOem] = useState(route.params?.part_number ?? "");
  const [carFit, setCarFit] = useState("");
  const [filters, setFilters] = useState<FilterValues>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(route.params?.openFilters ?? false);
  const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc">("newest");

  const [items, setItems] = useState<Part[]>([]);
  const [visible, setVisible] = useState(15);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const screenTitle =
    category && category !== "all"
      ? getCategory(category).name
      : q.trim()
        ? "Поиск"
        : "Все запчасти";

  const load = useCallback(async () => {
    setLoading(true);
    setLoadingMore(false);
    try {
      const data = await api.getParts({
        ...toApiParams({
          category: category !== "all" ? category : undefined,
          q: q.trim() || undefined,
          part_number: oem.trim() || undefined,
          filters,
        }),
        car_fit: carFit.trim() || undefined,
        sort,
      });
      setItems(data);
      setVisible(15);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [category, q, oem, carFit, filters, sort]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (route.params?.category) setCategory(route.params.category);
  }, [route.params?.category]);

  useEffect(() => {
    if (route.params?.openFilters) setFiltersOpen(true);
  }, [route.params?.openFilters]);

  const loadMore = () => {
    if (loadingMore || loading || visible >= items.length) return;
    setLoadingMore(true);
    setTimeout(() => {
      setVisible((v) => Math.min(v + 15, items.length));
      setLoadingMore(false);
    }, 200);
  };

  const saveSearch = async () => {
    const label =
      q.trim() ||
      (category !== "all" ? getCategory(category).name : "") ||
      oem.trim() ||
      "Мой поиск";
    await storage.addSavedSearch({
      label,
      q: q.trim() || undefined,
      category: category !== "all" ? category : undefined,
      part_number: oem.trim() || undefined,
    });
    Alert.alert("Сохранено", "Поиск добавлен в «Избранное → Сохранённые поиски»");
  };

  const ListHeader = (
    <View style={styles.listHeader}>
      <View style={styles.searchRow}>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Что будем искать?"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={load}
          />
        </View>
        <Pressable style={styles.filterLink} onPress={() => setFiltersOpen(true)}>
          <Text style={styles.filterLinkText}>Фильтр</Text>
        </Pressable>
      </View>

      <View style={styles.actionsRow}>
        <Pressable style={styles.actionBtn} onPress={() => setFiltersOpen(true)}>
          <Ionicons name="options-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.actionText}>Фильтры</Text>
        </Pressable>
        <Pressable
          style={styles.actionBtn}
          onPress={() =>
            setSort((s) => (s === "newest" ? "price_asc" : s === "price_asc" ? "price_desc" : "newest"))
          }
        >
          <Ionicons name="swap-vertical-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.actionText}>
            {sort === "newest" ? "Новые" : sort === "price_asc" ? "Дешевле" : "Дороже"}
          </Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={saveSearch}>
          <Ionicons name="bookmark-outline" size={18} color={colors.orange} />
          <Text style={[styles.actionText, { color: colors.orange }]}>Сохранить</Text>
        </Pressable>
      </View>

      <View style={styles.oemRow}>
        <View style={styles.oemField}>
          <Ionicons name="barcode-outline" size={16} color={colors.textMuted} />
          <TextInput
            style={styles.oemInput}
            placeholder="Номер запчасти"
            placeholderTextColor={colors.textMuted}
            value={oem}
            onChangeText={setOem}
            onSubmitEditing={load}
          />
        </View>
        <View style={[styles.oemField, { flex: 1.15 }]}>
          <Ionicons name="car-outline" size={16} color={colors.textMuted} />
          <TextInput
            style={styles.oemInput}
            placeholder="Подходит для"
            placeholderTextColor={colors.textMuted}
            value={carFit}
            onChangeText={setCarFit}
            onSubmitEditing={load}
          />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
        {CATEGORIES.map((c) => (
          <Chip
            key={c.id}
            label={c.name}
            active={category === c.id}
            onPress={() => setCategory(c.id)}
          />
        ))}
      </ScrollView>

      <Text style={styles.count}>
        {items.length} {items.length === 1 ? "объявление" : items.length < 5 ? "объявления" : "объявлений"}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.navBar}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={styles.navTitle} numberOfLines={1}>
          {screenTitle}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <FiltersModal
        visible={filtersOpen}
        values={filters}
        onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
        onClose={() => setFiltersOpen(false)}
        onReset={() => {
          setFilters(EMPTY_FILTERS);
          load();
        }}
        onApply={() => {
          setFiltersOpen(false);
          load();
        }}
      />

      {loading && items.length === 0 ? (
        <View style={styles.center}>
          {ListHeader}
          <ActivityIndicator color={colors.orange} size="large" style={{ marginTop: 24 }} />
        </View>
      ) : (
        <FlatList
          data={items.slice(0, visible)}
          keyExtractor={(p) => String(p.id)}
          ListHeaderComponent={ListHeader}
          renderItem={({ item }) => (
            <PartCard part={item} onPress={() => navigation.navigate("PartDetail", { id: item.id })} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={load}
          refreshing={loading}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore && visible < items.length ? (
              <ActivityIndicator color={colors.orange} style={{ paddingVertical: 20 }} />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={48} color={colors.border} />
              <Text style={styles.emptyTitle}>Ничего не найдено</Text>
              <Text style={styles.emptySub}>Измените запрос или фильтры</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingBottom: 4,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  navTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "800", color: colors.text },
  center: { flex: 1 },
  listHeader: { paddingBottom: 4 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  searchWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  searchInput: { flex: 1, fontSize: 16, color: colors.text },
  filterLink: { paddingVertical: 12 },
  filterLinkText: { fontSize: 16, fontWeight: "800", color: colors.orange },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: spacing.md,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 10,
  },
  actionText: { fontSize: 12, fontWeight: "700", color: colors.textSecondary },
  oemRow: { flexDirection: "row", gap: 8, paddingHorizontal: spacing.md, marginTop: 8 },
  oemField: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 10,
    minHeight: 44,
  },
  oemInput: { flex: 1, fontSize: 14, color: colors.text },
  chipsScroll: { marginTop: 10, paddingHorizontal: spacing.md },
  count: {
    ...typography.caption,
    color: colors.textMuted,
    paddingHorizontal: spacing.md,
    marginTop: 10,
    marginBottom: 4,
    fontWeight: "600",
  },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
  empty: { alignItems: "center", paddingVertical: 48, gap: 8 },
  emptyTitle: { ...typography.h2, color: colors.text },
  emptySub: { fontSize: 14, color: colors.textMuted },
});
