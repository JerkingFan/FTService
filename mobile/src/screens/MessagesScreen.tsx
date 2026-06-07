import React from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Button } from "../components/ui/Button";
import { api } from "../api";
import type { RootStackParamList } from "../navigation/types";
import { colors, spacing, typography } from "../theme";

type Nav = NativeStackNavigationProp<RootStackParamList, "Messages">;

interface Props {
  navigation: Nav;
}

export function MessagesScreen(_props: Props) {
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
      <View style={styles.container}>
        <Text style={styles.title}>Сообщения</Text>
        <Text style={styles.sub}>
          Переписка появится здесь. Пока можно написать в поддержку или продавцу через карточку.
        </Text>

        <View style={styles.card}>
          <View style={styles.icon}>
            <Ionicons name="chatbubbles-outline" size={26} color={colors.orange} />
          </View>
          <Text style={styles.cardTitle}>Поддержка FTservice</Text>
          <Text style={styles.cardSub}>Ответим в Telegram или WhatsApp</Text>
          <Button label="Открыть Telegram" onPress={openTelegram} style={{ marginTop: 12 }} />
          <Button
            label="Открыть WhatsApp"
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
  title: { ...typography.hero, fontSize: 28, color: colors.text },
  sub: { fontSize: 15, color: colors.textMuted, marginTop: 6, marginBottom: spacing.lg, lineHeight: 22 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  icon: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.orangeSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  cardTitle: { ...typography.h2, color: colors.text, fontSize: 16 },
  cardSub: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
});

