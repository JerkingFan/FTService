import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SideDrawer } from "../components/ui/SideDrawer";
import type { RootStackParamList, TabParamList } from "../navigation/types";
import { useCity, CITIES } from "../context/CityContext";
import { colors, radius, spacing, typography } from "../theme";
import { CATEGORIES } from "../utils/format";

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "Home">,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: Nav;
}

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  all: "apps-outline",
  engine: "speedometer-outline",
  electrical: "flash-outline",
  body: "car-sport-outline",
  brakes: "disc-outline",
  suspension: "git-compare-outline",
  cooling: "snow-outline",
  transmission: "swap-horizontal-outline",
};

export function CategoriesScreen({ navigation }: Props) {
  const [selected, setSelected] = useState<string>("all");
  const [drawer, setDrawer] = useState(false);
  const [q, setQ] = useState("");
  const { city, setCity } = useCity();

  const cats = useMemo(() => CATEGORIES.filter((c) => c.id !== "all"), []);

  const list = useMemo(
    () => [{ id: "all", name: "Автозапчасти", abbr: "••" }, ...cats],
    [cats]
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <SideDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        headerTitle="FTservice"
        items={[
          { icon: "search-outline", label: "Искать объявления", onPress: () => (navigation as any).navigate("Parts") },
          { icon: "add-circle-outline", label: "Добавить объявление", onPress: () => (navigation as any).navigate("SubmitPart") },
          { icon: "chatbubbles-outline", label: "Сообщения", onPress: () => (navigation as any).navigate("Messages"), badge: 7 },
          { icon: "heart-outline", label: "Покупки и избранное", onPress: () => (navigation as any).navigate("Favorites") },
          { icon: "flash-outline", label: "Мастера", onPress: () => (navigation as any).navigate("Masters") },
          {
            icon: "location-outline",
            label: "Изменить город",
            onPress: () => setCity(CITIES[0]),
          },
          { icon: "settings-outline", label: "Настройки", onPress: () => {} },
          { icon: "help-circle-outline", label: "Справка и правила", onPress: () => {} },
        ]}
      />

      <View style={styles.topBar}>
        <Pressable style={styles.burger} onPress={() => setDrawer(true)} hitSlop={10}>
          <Ionicons name="menu" size={24} color={colors.text} />
        </Pressable>
        <Pressable style={styles.cityBtn} onPress={() => setCity(city.id === "all" ? CITIES[1] : CITIES[0])}>
          <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.cityText}>{city.label}</Text>
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Что будем искать?"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          returnKeyType="search"
          onSubmitEditing={() => (navigation as any).navigate("Parts", { q, part_number: undefined })}
        />
      </View>

      <FlatList
        data={list}
        keyExtractor={(c) => c.id}
        ListHeaderComponent={<Text style={styles.sectionTitle}>Категории</Text>}
        renderItem={({ item }) => {
          const active = selected === item.id;
          return (
            <Pressable
              style={({ pressed }) => [
                styles.tile,
                active && styles.tileActive,
                pressed && styles.pressed,
              ]}
              onPress={() => {
                setSelected(item.id);
                (navigation as any).navigate("Parts", {
                  q: "",
                  part_number: undefined,
                });
              }}
            >
              <View style={[styles.tileImage, { backgroundColor: active ? colors.text : colors.bg }]}>
                <Ionicons
                  name={ICONS[item.id] ?? "pricetags-outline"}
                  size={40}
                  color={active ? "#fff" : colors.textSecondary}
                />
              </View>
              <Text style={[styles.tileLabel, active && styles.tileLabelActive]} numberOfLines={2}>
                {item.name}
              </Text>
            </Pressable>
          );
        }}
        numColumns={2}
        columnWrapperStyle={styles.col}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  burger: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  cityBtn: {
    flex: 1,
    marginLeft: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cityText: { fontSize: 14, fontWeight: "600", color: colors.textSecondary },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    height: 48,
  },
  searchInput: { flex: 1, fontSize: 16, color: colors.text },
  sectionTitle: {
    ...typography.h2,
    fontSize: 16,
    color: colors.textMuted,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  content: { paddingBottom: spacing.xxl, paddingHorizontal: spacing.md },
  col: { gap: 10, marginBottom: 10 },
  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: "hidden",
    minHeight: 160,
  },
  tileActive: { borderColor: colors.text },
  pressed: { opacity: 0.9 },
  tileImage: { height: 110, alignItems: "center", justifyContent: "center" },
  tileLabel: { padding: 12, fontSize: 14, fontWeight: "700", color: colors.textSecondary },
  tileLabelActive: { color: colors.text },
});

