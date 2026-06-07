import React, { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CategoryGridSection } from "../components/CategoryGridSection";
import { SideDrawer } from "../components/ui/SideDrawer";
import type { RootStackParamList, TabParamList } from "../navigation/types";
import { useCity, CITIES } from "../context/CityContext";
import { colors, radius, spacing } from "../theme";

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "Home">,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: Nav;
}

export function HomeScreen({ navigation }: Props) {
  const [drawer, setDrawer] = useState(false);
  const [q, setQ] = useState("");
  const { city, setCity } = useCity();

  const cycleCity = () => {
    const idx = CITIES.findIndex((c) => c.id === city.id);
    setCity(CITIES[(idx + 1) % CITIES.length]);
  };

  const openFeed = (params?: RootStackParamList["Parts"]) => {
    setDrawer(false);
    navigation.navigate("Parts", params);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <SideDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        headerTitle="FTservice"
        items={[
          { icon: "search-outline", label: "Все объявления", onPress: () => openFeed() },
          {
            icon: "add-circle-outline",
            label: "Добавить объявление",
            onPress: () => {
              setDrawer(false);
              navigation.navigate("SubmitPart");
            },
          },
          { icon: "chatbubbles-outline", label: "Сообщения", onPress: () => navigation.navigate("Messages") },
          { icon: "heart-outline", label: "Избранное", onPress: () => navigation.navigate("Favorites") },
          { icon: "flash-outline", label: "Мастера", onPress: () => navigation.navigate("Masters") },
        ]}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.topBar}>
          <Pressable style={styles.burger} onPress={() => setDrawer(true)} hitSlop={10}>
            <Ionicons name="menu" size={26} color={colors.text} />
          </Pressable>
          <Pressable style={styles.cityBtn} onPress={cycleCity}>
            <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.cityText}>{city.label}</Text>
          </Pressable>
        </View>

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
              onSubmitEditing={() => openFeed({ q: q.trim() || undefined })}
            />
          </View>
          <Pressable style={styles.filterBtn} onPress={() => openFeed({ q: q.trim() || undefined, openFilters: true })}>
            <Text style={styles.filterBtnText}>Фильтр</Text>
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [styles.allTile, pressed && styles.pressed]}
          onPress={() => openFeed()}
        >
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=800&q=80",
            }}
            style={styles.allTileImg}
            resizeMode="cover"
          />
          <View style={styles.allTileText}>
            <Text style={styles.allTileTitle}>Все автозапчасти</Text>
            <Text style={styles.allTileSub}>Список объявлений как на Дроме</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.orange} />
        </Pressable>

        <CategoryGridSection title="Категории" onCategory={(categoryId) => openFeed({ category: categoryId })} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: spacing.xxl },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: 4,
    paddingBottom: 8,
  },
  burger: { padding: 4 },
  cityBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
    paddingVertical: 8,
  },
  cityText: { fontSize: 15, fontWeight: "600", color: colors.textSecondary },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
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
  filterBtn: { paddingHorizontal: 4, paddingVertical: 12 },
  filterBtnText: { fontSize: 16, fontWeight: "800", color: colors.orange },
  allTile: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: "hidden",
    minHeight: 88,
  },
  allTileImg: { width: 100, height: 88 },
  allTileText: { flex: 1, paddingHorizontal: 12 },
  allTileTitle: { fontSize: 17, fontWeight: "800", color: colors.text },
  allTileSub: { fontSize: 12, color: colors.orange, fontWeight: "600", marginTop: 4 },
  pressed: { opacity: 0.92 },
});
