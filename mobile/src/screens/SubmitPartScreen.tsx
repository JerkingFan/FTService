import React, { useState } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../api";
import type { RootStackParamList } from "../navigation/types";
import { colors, spacing } from "../theme";

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  navigation: Nav;
}

export function SubmitPartScreen({ navigation }: Props) {
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [title, setTitle] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [price, setPrice] = useState("");
  const [car, setCar] = useState("");
  const [fits, setFits] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const priceNum = parseInt(price, 10);
    if (!contactName || !contactPhone || !title || !car || !location || !priceNum) {
      Alert.alert("Заполните обязательные поля");
      return;
    }
    setLoading(true);
    try {
      await api.submitPart({
        contact_name: contactName,
        contact_phone: contactPhone,
        title,
        part_number: partNumber || null,
        price: priceNum,
        condition: "used",
        category: "electrical",
        car,
        fits: fits
          ? fits.split(/[,;]/).map((s) => s.trim()).filter(Boolean)
          : null,
        location,
        notes: notes || null,
      });
      Alert.alert("Отправлено", "Заявка принята. Модератор свяжется с вами.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert("Ошибка", e instanceof Error ? e.message : "Не удалось отправить");
    } finally {
      setLoading(false);
    }
  };

  const openMessenger = async (type: "wa" | "tg") => {
    const cfg = await api.getConfig();
    const msg = encodeURIComponent("Хочу разместить объявление на FTservice");
    if (type === "wa") {
      Linking.openURL(`https://wa.me/${cfg.whatsapp}?text=${msg}`);
    } else {
      Linking.openURL(`https://t.me/${cfg.telegram.replace("@", "")}?text=${msg}`);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Подать объявление</Text>
      <Text style={styles.sub}>После проверки появится в каталоге</Text>

      <TextInput style={styles.input} placeholder="Ваше имя *" value={contactName} onChangeText={setContactName} />
      <TextInput style={styles.input} placeholder="Телефон *" value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="Название детали *" value={title} onChangeText={setTitle} />
      <TextInput style={styles.input} placeholder="Номер запчасти" value={partNumber} onChangeText={setPartNumber} />
      <TextInput style={styles.input} placeholder="Цена (сом) *" value={price} onChangeText={setPrice} keyboardType="number-pad" />
      <TextInput style={styles.input} placeholder="Авто / марка *" value={car} onChangeText={setCar} />
      <TextInput style={styles.input} placeholder="Подходит для (через запятую)" value={fits} onChangeText={setFits} />
      <TextInput style={styles.input} placeholder="Район *" value={location} onChangeText={setLocation} />
      <TextInput style={[styles.input, styles.area]} placeholder="Комментарий" value={notes} onChangeText={setNotes} multiline />

      <TouchableOpacity style={styles.btn} onPress={submit} disabled={loading}>
        <Text style={styles.btnText}>{loading ? "Отправка…" : "Отправить на модерацию"}</Text>
      </TouchableOpacity>

      <Text style={styles.or}>или</Text>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.msg, styles.wa]} onPress={() => openMessenger("wa")}>
          <Text style={styles.msgText}>WhatsApp</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.msg, styles.tg]} onPress={() => openMessenger("tg")}>
          <Text style={styles.msgText}>Telegram</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { padding: spacing.md, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: "800" },
  sub: { fontSize: 14, color: colors.gray500, marginBottom: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    fontSize: 15,
  },
  area: { minHeight: 80, textAlignVertical: "top" },
  btn: {
    backgroundColor: colors.orange,
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: colors.white, fontWeight: "700" },
  or: { textAlign: "center", marginVertical: 12, color: colors.gray500 },
  row: { flexDirection: "row", gap: 10 },
  msg: { flex: 1, padding: 14, borderRadius: 10, alignItems: "center" },
  wa: { backgroundColor: colors.green },
  tg: { backgroundColor: colors.telegram },
  msgText: { color: colors.white, fontWeight: "700" },
});
