import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { MenuRow } from "../components/ui/MenuRow";
import { PageHeader } from "../components/ui/PageHeader";
import type { RootStackParamList, TabParamList } from "../navigation/types";
import type { CabinetData } from "../types";
import { colors, radius, shadow, spacing, typography } from "../theme";

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "Profile">,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: Nav;
}

const ROLE_LABELS: Record<string, string> = {
  buyer: "Покупатель",
  seller: "Продавец",
  master: "Мастер",
  moderator: "Модератор",
  admin: "Админ",
};

export function ProfileScreen({ navigation }: Props) {
  const { user, loading, logout } = useAuth();
  const [cabinet, setCabinet] = useState<CabinetData | null>(null);
  const [loadingCabinet, setLoadingCabinet] = useState(false);

  const loadCabinet = useCallback(async () => {
    if (!user) return;
    setLoadingCabinet(true);
    try {
      const data = await api.getCabinet();
      setCabinet(data);
    } catch {
      setCabinet(null);
    } finally {
      setLoadingCabinet(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadCabinet();
    }, [loadCabinet])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.orange} />
      </View>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.guest}>
          <View style={styles.guestIcon}>
            <Ionicons name="person-outline" size={40} color={colors.orange} />
          </View>
          <Text style={styles.guestTitle}>Профиль</Text>
          <Text style={styles.guestSub}>Войдите, чтобы записываться к мастерам и видеть историю</Text>
          <Button label="Войти" onPress={() => navigation.navigate("Login")} style={{ width: "100%" }} />
          <Button
            label="Создать аккаунт"
            variant="secondary"
            onPress={() => navigation.navigate("Register")}
            style={{ width: "100%", marginTop: 10 }}
          />
          <View style={styles.menuGroup}>
            <MenuRow
              icon="flash-outline"
              label="Мастера"
              iconBg={colors.greenSoft}
              iconColor={colors.green}
              onPress={() => (navigation as any).navigate("Masters")}
            />
            <MenuRow
              icon="chatbubbles-outline"
              label="Сообщения"
              iconBg={colors.telegramSoft}
              iconColor={colors.telegram}
              onPress={() => (navigation as any).navigate("Messages")}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const initials = user.full_name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader title="Профиль" />

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{user.full_name}</Text>
            <Text style={styles.email}>{user.email}</Text>
            <View style={styles.rolePill}>
              <Text style={styles.roleText}>{ROLE_LABELS[user.role] || user.role}</Text>
            </View>
            {user.phone ? <Text style={styles.phone}>{user.phone}</Text> : null}
          </View>
        </View>

        <View style={styles.menuGroup}>
          <MenuRow
            icon="add-circle-outline"
            label="Подать объявление"
            onPress={() => navigation.navigate("SubmitPart")}
          />
          <MenuRow
            icon="heart-outline"
            label="Избранное"
            iconBg="#FDE8E8"
            iconColor="#E03E3E"
            onPress={() => (navigation as any).navigate("Favorites")}
          />
          <MenuRow
            icon="flash-outline"
            label="Мастера"
            iconBg={colors.greenSoft}
            iconColor={colors.green}
            onPress={() => (navigation as any).navigate("Masters")}
          />
          <MenuRow
            icon="chatbubbles-outline"
            label="Сообщения"
            iconBg={colors.telegramSoft}
            iconColor={colors.telegram}
            onPress={() => (navigation as any).navigate("Messages")}
          />
        </View>

        {loadingCabinet ? (
          <ActivityIndicator color={colors.orange} style={{ marginTop: 24 }} />
        ) : cabinet ? (
          <>
            <Text style={styles.section}>Записи</Text>
            {cabinet.bookings.length === 0 ? (
              <Text style={styles.empty}>Пока нет записей</Text>
            ) : (
              cabinet.bookings.map((b) => (
                <View key={b.id} style={styles.item}>
                  <View style={styles.itemHead}>
                    <Text style={styles.itemTitle}>{b.master_name}</Text>
                    <View style={styles.statusPill}>
                      <Text style={styles.statusText}>{b.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.itemMeta}>
                    {b.booking_date} · {String(b.booking_time).slice(0, 5)} · {b.service}
                  </Text>
                </View>
              ))
            )}

            <Text style={styles.section}>История</Text>
            {cabinet.repairs.length === 0 ? (
              <Text style={styles.empty}>История пуста</Text>
            ) : (
              cabinet.repairs.map((r) => (
                <View key={r.id} style={styles.item}>
                  <Text style={styles.itemTitle}>{r.title}</Text>
                  <Text style={styles.itemMeta}>
                    {r.master} · {r.cost.toLocaleString("ru-RU")} сом
                  </Text>
                </View>
              ))
            )}
          </>
        ) : null}

        <TouchableOpacity style={styles.logout} onPress={logout}>
          <Text style={styles.logoutText}>Выйти</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  scroll: { paddingBottom: spacing.xxl },
  menuGroup: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  guest: {
    flex: 1,
    padding: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  guestIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.orangeSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  guestTitle: { ...typography.h1, color: colors.text, marginBottom: 8 },
  guestSub: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  profileCard: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 14,
    marginHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadow.card,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 20 },
  profileInfo: { flex: 1 },
  name: { ...typography.h1, fontSize: 18, color: colors.text },
  email: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  rolePill: {
    alignSelf: "flex-start",
    marginTop: 8,
    backgroundColor: colors.orangeSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  roleText: { fontSize: 12, fontWeight: "700", color: colors.orange },
  phone: { fontSize: 14, color: colors.textSecondary, marginTop: 6 },
  section: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: 10,
    marginHorizontal: spacing.md,
  },
  item: {
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: radius.md,
    marginBottom: 8,
    marginHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  itemHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemTitle: { fontWeight: "700", fontSize: 15, color: colors.text, flex: 1 },
  statusPill: {
    backgroundColor: colors.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  statusText: { fontSize: 11, fontWeight: "600", color: colors.textMuted },
  itemMeta: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  empty: { fontSize: 14, color: colors.textMuted },
  logout: { marginTop: spacing.xl, alignItems: "center", padding: 14 },
  logoutText: { color: colors.danger, fontWeight: "600", fontSize: 15 },
});
