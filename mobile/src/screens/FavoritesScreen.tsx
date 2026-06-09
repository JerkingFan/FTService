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
import type { RootStackParamList } from "../navigation/types";
import { storage, type SavedSearch } from "../storage";
import type { Master, Part } from "../types";
import { colors, radius, spacing, typography } from "../theme";
import { describeSearch } from "../utils/savedSearch";

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<{ Favorites: undefined }, "Favorites">,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: Nav;
}

type Tab = "favorites" | "searches";
type FavMode = "parts" | "masters";

export function FavoritesScreen({ navigation }: Props) {
  const [tab, setTab] = useState<Tab>("favorites");
  const [mode, setMode] = useState<FavMode>("parts");
  const [parts, setParts] = useState<Part[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [favParts, favMasters, saved] = await Promise.all([
        storage.getFavoritePartIds(),
        storage.getFavoriteMasterIds(),
        storage.getSavedSearches(),
      ]);
      const [allParts, allMasters] = await Promise.all([api.getParts({}), api.getMasters()]);
      setParts(allParts.filter((p) => favParts.includes(p.id)));
      setMasters(allMasters.filter((m) => favMasters.includes(m.id)));
      setSearches(saved);
    } catch {
      setParts([]);
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
      car_fit: s.car_fit,
    });
  };

  const removeSearch = async (id: string) => {
    await storage.removeSavedSearch(id);
    setSearches((prev) => prev.filter((x) => x.id !== id));
  };

  const favData = mode === "parts" ? parts : masters;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FlatList
        data={tab === "searches" ? searches : (favData as any[])}
        key={`${tab}-${tab === "favorites" ? mode : "search"}`}
        keyExtractor={(x: any) => String(x.id)}
        ListHeaderComponent={
          <View style={styles.header}>
            <PageHeader title="Избранное" subtitle="Любимые объявления и сохранённые поиски" />
            <View style={styles.tabs}>
              <Pressable
                style={[styles.tabBtn, tab === "favorites" && styles.tabBtnActive]}
                onPress={() => setTab("favorites")}
              >
                <Ionicons
                  name={tab === "favorites" ? "heart" : "heart-outline"}
                  size={18}
                  color={tab === "favorites" ? colors.orange : colors.textMuted}
                />
                <Text style={[styles.tabText, tab === "favorites" && styles.tabTextActive]}>
                  Избранное
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tabBtn, tab === "searches" && styles.tabBtnActive]}
                onPress={() => setTab("searches")}
              >
                <Ionicons
                  name={tab === "searches" ? "bookmark" : "bookmark-outline"}
                  size={18}
                  color={tab === "searches" ? colors.orange : colors.textMuted}
                />
                <Text style={[styles.tabText, tab === "searches" && styles.tabTextActive]}>
                  Сохранённый поиск
                </Text>
              </Pressable>
            </View>
            {tab === "favorites" ? (
              <View style={styles.subModes}>
                <Chip label="Запчасти" active={mode === "parts"} onPress={() => setMode("parts")} />
                <Chip label="Мастера" active={mode === "masters"} onPress={() => setMode("masters")} />
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => {
          if (tab === "searches") {
            const s = item as SavedSearch;
            return (
              <Pressable style={styles.searchRow} onPress={() => openSearch(s)}>
                <View style={styles.searchIcon}>
                  <Ionicons name="search" size={20} color={colors.orange} />
                </View>
                <View style={styles.searchBody}>
                  <Text style={styles.searchLabel}>{s.label}</Text>
                  <Text style={styles.searchMeta} numberOfLines={2}>
                    {describeSearch(s)}
                  </Text>
                </View>
                <Pressable hitSlop={12} onPress={() => removeSearch(s.id)}>
                  <Ionicons name="close-circle" size={22} color={colors.textMuted} />
                </Pressable>
              </Pressable>
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
              name={tab === "searches" ? "bookmark-outline" : "heart-outline"}
              size={52}
              color={colors.border}
            />
            <Text style={styles.emptyTitle}>
              {tab === "searches" ? "Нет сохранённых поисков" : "Пока пусто"}
            </Text>
            <Text style={styles.emptySub}>
              {tab === "searches"
                ? "Поиски сохраняются автоматически, когда вы ищете запчасти. Можно также нажать «Сохранить» на экране поиска."
                : "Нажмите сердечко на карточке объявления, чтобы добавить в избранное"}
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
  tabs: {
    flexDirection: "row",
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  tabBtnActive: { backgroundColor: colors.orangeSoft },
  tabText: { fontSize: 13, fontWeight: "700", color: colors.textMuted },
  tabTextActive: { color: colors.orange },
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
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.orangeSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBody: { flex: 1 },
  searchLabel: { fontSize: 16, fontWeight: "700", color: colors.text },
  searchMeta: { fontSize: 13, color: colors.textMuted, marginTop: 3, lineHeight: 18 },
  empty: { alignItems: "center", paddingTop: 48, paddingHorizontal: 18, gap: 10 },
  emptyTitle: { ...typography.h2, color: colors.text },
  emptySub: { fontSize: 14, color: colors.textMuted, textAlign: "center", lineHeight: 20 },
});
