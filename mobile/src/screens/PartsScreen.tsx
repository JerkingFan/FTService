import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, type CompositeNavigationProp, type RouteProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../api";
import { PartCard } from "../components/PartCard";
import { Chip } from "../components/ui/Chip";
import { PageHeader } from "../components/ui/PageHeader";
import { SearchField } from "../components/ui/SearchField";
import type { RootStackParamList } from "../navigation/types";
import type { Part } from "../types";
import { colors, radius, spacing, typography } from "../theme";
import { storage } from "../storage";
import { CATEGORIES, getCategory } from "../utils/format";
import { rememberSearch } from "../utils/savedSearch";

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<any, any>,
  NativeStackNavigationProp<RootStackParamList, "Parts">
>;
type PartsRoute = RouteProp<RootStackParamList, "Parts">;

interface Props {
  navigation: Nav;
  route: PartsRoute;
}

export function PartsScreen({ navigation, route }: Props) {
  const [items, setItems] = useState<Part[]>([]);
  const [visible, setVisible] = useState(12);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [q, setQ] = useState(route.params?.q || "");
  const [oem, setOem] = useState(route.params?.part_number || "");
  const [carFit, setCarFit] = useState(route.params?.car_fit || "");
  const [category, setCategory] = useState(route.params?.category ?? "all");
  const [filtersOpen, setFiltersOpen] = useState(route.params?.openFilters ?? false);
  const [condition, setCondition] = useState<"all" | "used" | "new">("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [location, setLocation] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc">("newest");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadingMore(false);
    try {
      const data = await api.getParts({
        q: q || undefined,
        part_number: oem || undefined,
        car_fit: carFit || undefined,
        category: category === "all" ? undefined : category,
        condition: condition === "all" ? undefined : condition,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        location: location || undefined,
        verifiedOnly: verifiedOnly || undefined,
        sort,
      });
      setItems(data);
      setVisible(12);
      await rememberSearch({
        q,
        part_number: oem,
        car_fit: carFit,
        category,
      });
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [q, oem, carFit, category, condition, minPrice, maxPrice, location, verifiedOnly, sort]);

  const loadMore = () => {
    if (loadingMore || loading) return;
    if (visible >= items.length) return;
    setLoadingMore(true);
    // demo: just reveal more from already-fetched list
    setTimeout(() => {
      setVisible((v) => Math.min(v + 12, items.length));
      setLoadingMore(false);
    }, 250);
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    load();
  }, [category]);

  useEffect(() => {
    if (route.params?.openFilters) setFiltersOpen(true);
  }, [route.params?.openFilters]);

  useEffect(() => {
    if (route.params?.category) setCategory(route.params.category);
  }, [route.params?.category]);

  useEffect(() => {
    if (route.params?.q !== undefined) setQ(route.params.q);
  }, [route.params?.q]);

  useEffect(() => {
    if (route.params?.part_number !== undefined) setOem(route.params.part_number);
  }, [route.params?.part_number]);

  useEffect(() => {
    if (route.params?.car_fit !== undefined) setCarFit(route.params.car_fit);
  }, [route.params?.car_fit]);

  const saveCurrentSearch = async () => {
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
      car_fit: carFit.trim() || undefined,
    });
    Alert.alert("Сохранено", "Поиск добавлен в «Избранное → Сохранённый поиск»");
  };

  const ListHeader = (
    <View style={styles.header}>
      <PageHeader title="Поиск" subtitle="Запчасти в Бишкеке" />
      <View style={styles.searchWrap}>
        <SearchField value={q} onChangeText={setQ} placeholder="Название, марка…" onSubmit={load} />
      </View>
      <View style={styles.topActions}>
        <Pressable style={styles.filterBtn} onPress={() => setFiltersOpen(true)}>
          <Ionicons name="options-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.filterText}>Фильтры</Text>
        </Pressable>
        <Pressable
          style={styles.filterBtn}
          onPress={() => setSort((s) => (s === "newest" ? "price_asc" : s === "price_asc" ? "price_desc" : "newest"))}
        >
          <Ionicons name="swap-vertical-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.filterText}>
            {sort === "newest" ? "Новые" : sort === "price_asc" ? "Дешевле" : "Дороже"}
          </Text>
        </Pressable>
        <Pressable style={styles.filterBtn} onPress={saveCurrentSearch}>
          <Ionicons name="bookmark-outline" size={18} color={colors.orange} />
          <Text style={[styles.filterText, { color: colors.orange }]}>Сохранить</Text>
        </Pressable>
      </View>
      <View style={styles.filterRow}>
        <View style={styles.filterField}>
          <Ionicons name="barcode-outline" size={16} color={colors.textMuted} />
          <TextInput
            style={styles.filterInput}
            placeholder="Номер запчасти"
            placeholderTextColor={colors.textMuted}
            value={oem}
            onChangeText={setOem}
            onSubmitEditing={load}
          />
        </View>
        <View style={[styles.filterField, { flex: 1.2 }]}>
          <Ionicons name="car-outline" size={16} color={colors.textMuted} />
          <TextInput
            style={styles.filterInput}
            placeholder="Подходит для"
            placeholderTextColor={colors.textMuted}
            value={carFit}
            onChangeText={setCarFit}
            onSubmitEditing={load}
          />
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
        {CATEGORIES.map((c) => (
          <Chip
            key={c.id}
            label={c.name}
            active={category === c.id}
            onPress={() => {
              setCategory(c.id);
            }}
          />
        ))}
      </ScrollView>
      <Text style={styles.count}>{items.length} объявлений</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Modal visible={filtersOpen} transparent animationType="slide" onRequestClose={() => setFiltersOpen(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setFiltersOpen(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Фильтр</Text>
              <Pressable onPress={() => setFiltersOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              <Text style={styles.modalLabel}>Состояние</Text>
              <View style={styles.chipRow}>
                {(["all", "used", "new"] as const).map((c) => (
                  <Pressable
                    key={c}
                    style={[styles.pill, condition === c && styles.pillActive]}
                    onPress={() => setCondition(c)}
                  >
                    <Text style={[styles.pillText, condition === c && styles.pillTextActive]}>
                      {c === "all" ? "Любое" : c === "used" ? "Б/У" : "Новая"}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.modalLabel}>Цена, сом</Text>
              <View style={styles.priceRow}>
                <TextInput
                  value={minPrice}
                  onChangeText={setMinPrice}
                  placeholder="от"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  style={styles.priceInput}
                />
                <TextInput
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                  placeholder="до"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  style={styles.priceInput}
                />
              </View>

              <Text style={styles.modalLabel}>Район / место</Text>
              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="например: Кудайберген, Джал…"
                placeholderTextColor={colors.textMuted}
                style={styles.fullInput}
              />

              <Pressable style={styles.toggleRow} onPress={() => setVerifiedOnly((v) => !v)}>
                <View style={[styles.checkbox, verifiedOnly && styles.checkboxOn]}>
                  {verifiedOnly ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
                </View>
                <Text style={styles.toggleText}>Только проверенные</Text>
              </Pressable>

              <View style={styles.modalBtns}>
                <Pressable
                  style={[styles.modalBtn, styles.modalBtnGhost]}
                  onPress={() => {
                    setCondition("all");
                    setMinPrice("");
                    setMaxPrice("");
                    setLocation("");
                    setVerifiedOnly(false);
                  }}
                >
                  <Text style={styles.modalBtnGhostText}>Сбросить</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalBtn, styles.modalBtnPrimary]}
                  onPress={() => {
                    setFiltersOpen(false);
                    load();
                  }}
                >
                  <Text style={styles.modalBtnPrimaryText}>Показать</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </Modal>

        {loading && items.length === 0 ? (
          <View style={styles.center}>
            {ListHeader}
            <ActivityIndicator color={colors.orange} size="large" />
          </View>
        ) : (
          <FlatList
            data={items.slice(0, visible)}
            keyExtractor={(p) => String(p.id)}
            ListHeaderComponent={ListHeader}
            renderItem={({ item }) => (
              <PartCard
                part={item}
                onPress={() => navigation.navigate("PartDetail", { id: item.id })}
              />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            onRefresh={load}
            refreshing={loading}
            ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
            onEndReached={loadMore}
            onEndReachedThreshold={0.6}
            ListFooterComponent={
              loadingMore && visible < items.length ? (
                <View style={{ paddingVertical: 18 }}>
                  <ActivityIndicator color={colors.orange} />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Ionicons name="search-outline" size={48} color={colors.border} />
                <Text style={styles.emptyTitle}>Ничего не найдено</Text>
                <Text style={styles.emptySub}>Измените фильтры или запрос</Text>
              </View>
            }
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  center: { flex: 1 },
  header: { paddingBottom: 8 },
  searchWrap: { paddingHorizontal: spacing.md, marginBottom: 8 },
  topActions: { flexDirection: "row", gap: 10, paddingHorizontal: spacing.md, marginBottom: 10 },
  filterBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 12,
  },
  filterText: { fontSize: 13, fontWeight: "700", color: colors.textSecondary },
  filterRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  filterField: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    minHeight: 44,
  },
  filterInput: { flex: 1, marginLeft: 6, fontSize: 14, color: colors.text, paddingVertical: 8 },
  chips: { marginTop: 10, marginBottom: 4 },
  count: { ...typography.caption, color: colors.textMuted, marginTop: 8, marginBottom: 4 },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
  emptyBox: { alignItems: "center", paddingVertical: 48, gap: 8 },
  emptyTitle: { ...typography.h2, color: colors.text },
  emptySub: { fontSize: 14, color: colors.textMuted },

  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.35)" },
  modalSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.md,
    maxHeight: "82%",
  },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
  modalLabel: { fontSize: 13, fontWeight: "700", color: colors.textMuted, marginTop: 14, marginBottom: 8 },
  chipRow: { flexDirection: "row", gap: 10 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.bg,
  },
  pillActive: { backgroundColor: colors.text, borderColor: colors.text },
  pillText: { fontSize: 13, fontWeight: "700", color: colors.textSecondary },
  pillTextActive: { color: "#fff" },
  priceRow: { flexDirection: "row", gap: 10 },
  priceInput: {
    flex: 1,
    height: 46,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  fullInput: {
    height: 46,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: { backgroundColor: colors.orange, borderColor: colors.orange },
  toggleText: { fontSize: 14, fontWeight: "700", color: colors.textSecondary },
  modalBtns: { flexDirection: "row", gap: 10, marginTop: 18 },
  modalBtn: { flex: 1, height: 48, borderRadius: radius.lg, alignItems: "center", justifyContent: "center" },
  modalBtnGhost: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.borderLight },
  modalBtnGhostText: { fontSize: 15, fontWeight: "800", color: colors.textSecondary },
  modalBtnPrimary: { backgroundColor: colors.text },
  modalBtnPrimaryText: { fontSize: 15, fontWeight: "800", color: "#fff" },
});
