import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { PageHeader } from "../components/ui/PageHeader";
import { Button } from "../components/ui/Button";
import { api } from "../api";
import { tokenStorage } from "../tokenStorage";
import type { RootStackParamList, TabParamList } from "../navigation/types";
import type { Conversation } from "../types";
import { colors, radius, spacing, typography } from "../theme";

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "Chat">,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: Nav;
}

function formatWhen(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export function ChatScreen({ navigation }: Props) {
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    const token = await tokenStorage.getToken();
    setLoggedIn(!!token);
    if (!token) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setItems(await api.getConversations());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [navigation, load]);

  const openThread = (c: Conversation) => {
    navigation.navigate("ChatThread", {
      conversationId: c.id,
      title: c.part_title,
      peerName: c.peer_name,
    });
  };

  if (loggedIn === false) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <PageHeader title="Чаты" subtitle="Переписка с продавцами" />
        <View style={styles.guest}>
          <Ionicons name="chatbubbles-outline" size={52} color={colors.border} />
          <Text style={styles.guestTitle}>Войдите, чтобы писать в чате</Text>
          <Text style={styles.guestSub}>Сообщения по объявлениям сохраняются в личном кабинете</Text>
          <Button label="Войти" onPress={() => navigation.navigate("Login")} style={{ marginTop: 16 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FlatList
        data={items}
        keyExtractor={(c) => String(c.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.orange} />}
        ListHeaderComponent={<PageHeader title="Чаты" subtitle="Переписка с продавцами" />}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => openThread(item)}>
            <View style={styles.avatar}>
              {item.part_image_url ? (
                <Image source={{ uri: item.part_image_url }} style={styles.avatarImg} />
              ) : (
                <Ionicons name="cube-outline" size={22} color={colors.orange} />
              )}
            </View>
            <View style={styles.body}>
              <View style={styles.top}>
                <Text style={styles.peer} numberOfLines={1}>
                  {item.peer_name}
                </Text>
                <Text style={styles.when}>{formatWhen(item.last_message_at)}</Text>
              </View>
              <Text style={styles.partTitle} numberOfLines={1}>
                {item.part_title}
              </Text>
              <Text style={styles.preview} numberOfLines={1}>
                {item.last_message || "Нет сообщений"}
              </Text>
            </View>
            {item.unread_count > 0 ? (
              <View style={styles.unread}>
                <Text style={styles.unreadText}>{item.unread_count > 9 ? "9+" : item.unread_count}</Text>
              </View>
            ) : null}
          </Pressable>
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.orange} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.empty}>
              <Ionicons name="chatbubble-ellipses-outline" size={48} color={colors.border} />
              <Text style={styles.emptyTitle}>Пока нет диалогов</Text>
              <Text style={styles.emptySub}>
                Нажмите «Написать» на карточке объявления — чат откроется здесь
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.orangeSoft,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%" },
  body: { flex: 1 },
  top: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  peer: { flex: 1, fontSize: 16, fontWeight: "800", color: colors.text },
  when: { fontSize: 11, color: colors.textMuted },
  partTitle: { fontSize: 12, color: colors.orange, marginTop: 2, fontWeight: "600" },
  preview: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  unread: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.red,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  empty: { alignItems: "center", paddingTop: 48, paddingHorizontal: 20, gap: 8 },
  emptyTitle: { ...typography.h2, color: colors.text },
  emptySub: { fontSize: 14, color: colors.textMuted, textAlign: "center", lineHeight: 20 },
  guest: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  guestTitle: { ...typography.h2, color: colors.text, marginTop: 12 },
  guestSub: { fontSize: 14, color: colors.textMuted, textAlign: "center", marginTop: 6, lineHeight: 20 },
});
