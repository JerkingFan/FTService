import { Alert, Linking } from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../api";
import type { RootStackParamList } from "../navigation/types";
import type { Part } from "../types";
import { formatPrice } from "./format";
import { openPartChat } from "./chatNavigation";

function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function buildPartInquiryMessage(part: Part): string {
  const lines = [
    "Здравствуйте! Интересует объявление на FTservice:",
    "",
    part.title,
    formatPrice(part.price),
  ];
  if (part.part_number) lines.push(`OEM: ${part.part_number}`);
  if (part.car) lines.push(`Авто: ${part.car}`);
  return lines.join("\n");
}

export async function openWhatsAppForPart(part: Part): Promise<void> {
  const config = await api.getConfig();
  const phone = part.phone ? digitsOnly(part.phone) : config.whatsapp;
  const msg = encodeURIComponent(buildPartInquiryMessage(part));
  await Linking.openURL(`https://wa.me/${phone}?text=${msg}`);
}

export async function openTelegramForPart(part: Part): Promise<void> {
  const config = await api.getConfig();
  const user = config.telegram.replace("@", "");
  const msg = encodeURIComponent(buildPartInquiryMessage(part));
  await Linking.openURL(`https://t.me/${user}?text=${msg}`);
}

export async function callSellerPhone(part: Part): Promise<void> {
  if (!part.phone) return;
  await Linking.openURL(`tel:${part.phone.replace(/\s/g, "")}`);
}

/** Меню: чат / WhatsApp / Telegram / звонок */
export function showSellerContactMenu(
  part: Part,
  navigation?: NativeStackNavigationProp<RootStackParamList>
): void {
  const buttons: {
    text: string;
    onPress?: () => void;
    style?: "cancel" | "default" | "destructive";
  }[] = [];

  if (navigation) {
    buttons.push({
      text: "Написать в чате",
      onPress: () => openPartChat(part, navigation),
    });
  }

  buttons.push(
    {
      text: "WhatsApp",
      onPress: () => {
        openWhatsAppForPart(part).catch(() => {});
      },
    },
    {
      text: "Telegram",
      onPress: () => {
        openTelegramForPart(part).catch(() => {});
      },
    }
  );

  if (part.phone) {
    buttons.push({
      text: `Позвонить ${part.phone}`,
      onPress: () => {
        callSellerPhone(part).catch(() => {});
      },
    });
  }

  buttons.push({ text: "Отмена", style: "cancel" });

  Alert.alert(`Написать продавцу`, part.seller, buttons);
}
