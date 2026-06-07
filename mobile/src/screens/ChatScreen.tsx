import React from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { api } from "../api";
import type { RootStackParamList, TabParamList } from "../navigation/types";
import { colors, radius, spacing } from "../theme";

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "Chat">,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: Nav;
}

export function ChatScreen(_props: Props) {
  const openTelegram = async () => {
    const cfg = await api.getConfig();
    const user = cfg.telegram.replace("@", "");
    Linking.openURL(`https://t.me/${user}`);
  };

  const openWhatsApp = async () => {
    const cfg = await api.getConfig();
    Linking.openURL(`https://wa.me/${cfg.whatsapp}`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <PageHeader title="Чат" subtitle="Переписка и заявки" />
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.icon}>
            <Ionicons name="chatbubbles-outline" size={28} color={colors.orange} />
          </View>
          <Text style={styles.title}>Диалоги появятся здесь</Text>
          <Text style={styles.sub}>
            Пока можно писать продавцам через карточку или в поддержку.
          </Text>
          <Button label="Поддержка в Telegram" onPress={openTelegram} style={{ marginTop: 12 }} />
          <Button
            label="Поддержка в WhatsApp"
            variant="secondary"
            onPress={openWhatsApp}
            style={{ marginTop: 10 }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.md, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.orangeSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  title: { fontSize: 16, fontWeight: "700", color: colors.text },
  sub: { fontSize: 14, color: colors.textMuted, marginTop: 6, lineHeight: 20 },
});

