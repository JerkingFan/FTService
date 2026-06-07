import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import type { RootStackParamList } from "../navigation/types";
import { colors, radius, spacing, typography } from "../theme";

type Route = RouteProp<RootStackParamList, "Booking">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  route: Route;
  navigation: Nav;
}

const SERVICES = [
  { id: "diagnostic", label: "Диагностика" },
  { id: "repair", label: "Ремонт электрики" },
  { id: "install", label: "Установка запчасти" },
];

export function BookingScreen({ route, navigation }: Props) {
  const { user } = useAuth();
  const [service, setService] = useState("diagnostic");
  const [date, setDate] = useState("2026-05-20");
  const [time, setTime] = useState("10:00");
  const [phone, setPhone] = useState(user?.phone || "");
  const [problem, setProblem] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!user) {
      navigation.navigate("Login");
      return;
    }
    if (!phone.trim()) {
      Alert.alert("Укажите телефон");
      return;
    }
    setSending(true);
    try {
      await api.createBooking({
        master_id: route.params.masterId,
        service,
        booking_date: date,
        booking_time: time.length === 5 ? `${time}:00` : time,
        phone: phone.trim(),
        problem: problem || null,
      });
      Alert.alert("Готово", "Запись отправлена мастеру", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert("Ошибка", e instanceof Error ? e.message : "Не удалось записаться");
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.masterName}>{route.params.masterName}</Text>
        <Text style={styles.hint}>Выберите услугу и удобное время</Text>

        <Text style={styles.label}>Услуга</Text>
        <View style={styles.chips}>
          {SERVICES.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.chip, service === s.id && styles.chipActive]}
              onPress={() => setService(s.id)}
            >
              <Text style={[styles.chipText, service === s.id && styles.chipTextActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.label}>Дата</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="2026-05-20"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Время</Text>
            <TextInput
              style={styles.input}
              value={time}
              onChangeText={setTime}
              placeholder="10:00"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        <Text style={styles.label}>Телефон</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="+996 …"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Описание проблемы</Text>
        <TextInput
          style={[styles.input, styles.area]}
          value={problem}
          onChangeText={setProblem}
          multiline
          numberOfLines={4}
          placeholder="Кратко опишите, что нужно сделать"
          placeholderTextColor={colors.textMuted}
        />

        <Button label="Записаться" onPress={submit} loading={sending} style={{ marginTop: spacing.lg }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: 40 },
  masterName: { ...typography.h1, color: colors.text },
  hint: { fontSize: 14, color: colors.textMuted, marginTop: 4, marginBottom: spacing.md },
  label: { fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  area: { minHeight: 100, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 10 },
  field: { flex: 1 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.orange, backgroundColor: colors.orangeSoft },
  chipText: { fontSize: 13, color: colors.textSecondary, fontWeight: "600" },
  chipTextActive: { color: colors.orange, fontWeight: "700" },
});
