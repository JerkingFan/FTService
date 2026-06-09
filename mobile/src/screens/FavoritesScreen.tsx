import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../api";
import { MasterCard } from "../components/MasterCard";
import { PartCard } from "../components/PartCard";
import { Chip } from "../components/ui/Chip";
import { PageHeader } from "../components/ui/PageHeader";
import { DEMO_MODE } from "../config";
import type { RootStackParamList } from "../navigation/types";
import { storage, type SavedSearch } from "../storage";
import type { Master, Part } from "../types";
import { colors, radius, spacing, typography } from "../theme";

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<{ Favorites: undefined }, "Favorites">,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: Nav;
}

type Section = "searches" | "viewed" | "favorites";
type FavMode = "parts" | "masters";

const DEMO_SEARCHES: Omit<SavedSearch, "id" | "createdAt">[] = [
  { label: "Запчасти", q: "Запчасти" },
  { label: "Toyota Corolla", q: "Toyota Corolla" },
  { label: "Тормозные колодки", q: "колодки", category: "general" },
];

export function FavoritesScreen({ navigation }: Props) {
  const [section, setSection] = useState<Section>("searches");
  const [mode, setMode] = useState<FavMode>("parts");
  const [parts, setParts] = useState<Part[]>([]);
  const [viewed, setViewed] = useState<Part[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [favParts, favMasters, saved, viewedIds] = await Promise.all([
        storage.getFavoritePartIds(),
        storage.getFavoriteMasterIds(),
        storage.getSavedSearches(),
        storage.getViewedPartIds(),
      ]);
      const [allParts, allMasters] = await Promise.all([api.getParts({}), api.getMasters()]);
      setParts(allParts.filter((p) => favParts.includes(p.id)));
      setViewed(
        viewedIds
          .map((id) => allParts.find((p) => p.id === id))
          .filter((p): p is Part => Boolean(p))
      );
      setMasters(allMasters.filter((m) => favMasters.includes(m.id)));

      let list = saved;
      if (list.length === 0 && DEMO_MODE) {
        for (const s of DEMO_SEARCHES) {
          await storage.addSavedSearch(s);
        }
        list = await storage.getSavedSearches();
      }
      setSearches(list);
    } catch {
      setParts([]);
      setViewed([]);
      setMasters([]);
      setSearches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [navigation, load]);

  const openSearch = (s: SavedSearch) => {
    navigation.navigate("Parts", {
      q: s.q,
      category: s.category,
      part_number: s.part_number,
    });
  };

  const removeSearch = async (id: string) => {
    await storage.removeSavedSearch(id);
    setSearches((prev) => prev.filter((x) => x.id !== id));
  };

  const listData =
    section === "searches"
      ? searches
      : section === "viewed"
        ? viewed
        : mode === "parts"
          ? parts
          : masters;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FlatList
        data={listData as any[]}
        key={`${section}-${section === "favorites" ? mode : "x"}`}
        keyExtractor={(x: any) => String(x.id)}
        ListHeaderComponent={
          <View style={styles.header}>
            <PageHeader title="Избранное" subtitle="Сохранённые поиски и просмотры" />
            <View style={styles.modes}>
              <Chip
                label="Поиски"
                active={section === "searches"}
                onPress={() => setSection("searches")}
              />
              <Chip
                label="Просмотренные"
                active={section === "viewed"}
                onPress={() => setSection("viewed")}
              />
              <Chip
                label="Любимое"
                active={section === "favorites"}
                onPress={() => setSection("favorites")}
              />
            </View>
            {section === "favorites" ? (
              <View style={styles.subModes}>
                <Chip label="Запчасти" active={mode === "parts"} onPress={() => setMode("parts")} />
                <Chip label="Мастера" active={mode === "masters"} onPress={() => setMode("masters")} />
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => {
          if (section === "searches") {
            const s = item as SavedSearch;
            return (
              <Pressable style={styles.searchRow} onPress={() => openSearch(s)}>
                <View style={styles.searchIcon}>
                  <Ionicons name="bookmark" size={20} color={colors.orange} />
                </View>
                <View style={styles.searchBody}>
                  <Text style={styles.searchLabel}>{s.label}</Text>
                  <Text style={styles.searchMeta}>Сохранённый поиск</Text>
                </View>
                <Pressable hitSlop={12} onPress={() => removeSearch(s.id)}>
                  <Ionicons name="close-circle" size={22} color={colors.textMuted} />
                </Pressable>
              </Pressable>
            );
          }
          if (section === "viewed") {
            const p = item as Part;
            return (
              <PartCard
                part={p}
                onPress={() => navigation.navigate("PartDetail", { id: p.id })}
              />
            );
          }
          return mode === "parts" ? (
            <PartCard
              part={item as Part}
              onPress={() => navigation.navigate("PartDetail", { id: (item as Part).id })}
            />
          ) : (
            <MasterCard
              master={item as Master}
              onPress={() =>
                navigation.navigate("Booking", {
                  masterId: (item as Master).id,
                  masterName: (item as Master).name,
                })
              }
            />
          );
        }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.orange} />
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name={
                section === "searches"
                  ? "bookmark-outline"
                  : section === "viewed"
                    ? "eye-outline"
                    : "heart-outline"
              }
              size={52}
              color={colors.border}
            />
            <Text style={styles.emptyTitle}>
              {section === "searches"
                ? "Нет сохранённых поисков"
                : section === "viewed"
                  ? "Вы ещё ничего не смотрели"
                  : "Пока пусто"}
            </Text>
            <Text style={styles.emptySub}>
              {section === "searches"
                ? "На главной нажмите «Фильтр» или сохраните поиск на экране результатов"
                : section === "viewed"
                  ? "Открывайте объявления — они появятся здесь автоматически"
                  : "Нажмите сердечко на карточке, чтобы добавить в любимое"}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingBottom: 8 },
  modes: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: 8,
  },
  subModes: { flexDirection: "row", paddingHorizontal: spacing.md, marginBottom: spacing.sm, gap: 8 },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 14,
    marginBottom: 10,
  },
  searchIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.orangeSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBody: { flex: 1 },
  searchLabel: { fontSize: 16, fontWeight: "700", color: colors.text },
  searchMeta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  empty: { alignItems: "center", paddingTop: 48, paddingHorizontal: 18, gap: 10 },
  emptyTitle: { ...typography.h2, color: colors.text },
  emptySub: { fontSize: 14, color: colors.textMuted, textAlign: "center", lineHeight: 20 },
});
