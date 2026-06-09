import { Alert } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../api";
import type { RootStackParamList } from "../navigation/types";
import type { Part } from "../types";
import { tokenStorage } from "../tokenStorage";
import { buildPartInquiryMessage } from "./sellerContact";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export async function openPartChat(part: Part, navigation: Nav): Promise<void> {
  const token = await tokenStorage.getToken();
  if (!token) {
    Alert.alert("Вход", "Войдите, чтобы написать продавцу в чате", [
      { text: "Отмена", style: "cancel" },
      { text: "Войти", onPress: () => navigation.navigate("Login") },
    ]);
    return;
  }

  try {
    const conv = await api.startConversation(
      part.id,
      buildPartInquiryMessage(part).split("\n").slice(0, 3).join("\n")
    );
    navigation.navigate("ChatThread", {
      conversationId: conv.id,
      title: part.title,
      peerName: conv.peer_name,
    });
  } catch (e) {
    Alert.alert("Ошибка", e instanceof Error ? e.message : "Не удалось открыть чат");
  }
}
