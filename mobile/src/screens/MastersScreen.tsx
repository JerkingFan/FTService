import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../api";
import { MasterCard } from "../components/MasterCard";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import type { RootStackParamList } from "../navigation/types";
import type { Master } from "../types";
import { colors, radius, spacing, typography } from "../theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "Masters">;

interface Props {
  navigation: Nav;
}

export function MastersScreen({ navigation }: Props) {
  const [items, setItems] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);
  const [nearby, setNearby] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const load = useCallback(async (geo?: { lat: number; lng: number }) => {
    setLoading(true);
    try {
      const data = geo
        ? await api.getMasters({ lat: geo.lat, lng: geo.lng, radius_km: 20 })
        : await api.getMasters();
      setItems(data);
      setNearby(!!geo);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const findNearby = async () => {
    setGpsLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Геолокация", "Разрешите доступ к местоположению в настройках");
      setGpsLoading(false);
      return;
    }
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      await load({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch {
      Alert.alert("Ошибка", "Не удалось определить местоположение");
    } finally {
      setGpsLoading(false);
    }
  };

  const ListHeader = (
    <View style={styles.header}>
      <PageHeader title="Мастера" subtitle="Автоэлектрики · Бишкек" />
      <View style={styles.headerBtn}>
      <Button
        label={nearby ? "Показать всех" : "Рядом со мной"}
        onPress={nearby ? () => load() : findNearby}
        loading={gpsLoading}
        icon={
          <Ionicons
            name={nearby ? "list-outline" : "navigate-outline"}
            size={18}
            color="#fff"
          />
        }
      />
      </View>
      <Text style={styles.count}>
        {items.length} {nearby ? "рядом" : "мастеров"}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {loading && items.length === 0 ? (
        <View style={styles.center}>
          {ListHeader}
          <ActivityIndicator color={colors.orange} size="large" style={{ marginTop: 32 }} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(m) => String(m.id)}
          ListHeaderComponent={ListHeader}
          renderItem={({ item }) => (
            <MasterCard
              master={item}
              onPress={() =>
                navigation.navigate("Booking", { masterId: item.id, masterName: item.name })
              }
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => load()}
              tintColor={colors.orange}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="flash-outline" size={48} color={colors.border} />
              <Text style={styles.emptyTitle}>Мастеров не найдено</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1 },
  header: { paddingBottom: 8 },
  headerBtn: { paddingHorizontal: spacing.md },
  count: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 8,
    marginHorizontal: spacing.md,
    marginBottom: 4,
  },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
  empty: { alignItems: "center", paddingVertical: 48, gap: 8 },
  emptyTitle: { ...typography.h2, color: colors.text },
});
