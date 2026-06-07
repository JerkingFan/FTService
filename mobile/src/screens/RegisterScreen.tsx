import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import type { RootStackParamList } from "../navigation/types";
import { colors, spacing } from "../theme";

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  navigation: Nav;
}

export function RegisterScreen({ navigation }: Props) {
  const { refresh } = useAuth();
  const [role, setRole] = useState<"buyer" | "seller" | "master">("buyer");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (password.length < 6) {
      Alert.alert("Пароль минимум 6 символов");
      return;
    }
    if (role === "master" && !district.trim()) {
      Alert.alert("Укажите район для мастера");
      return;
    }
    setLoading(true);
    try {
      const data = await api.register({
        email,
        password,
        full_name: fullName,
        phone,
        role,
        district: role === "master" ? district : undefined,
      });
      await refresh();
      if (data.message) Alert.alert("Готово", data.message);
      navigation.goBack();
    } catch (e) {
      Alert.alert("Ошибка", e instanceof Error ? e.message : "Регистрация не удалась");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Регистрация</Text>

      <Text style={styles.label}>Тип аккаунта</Text>
      <View style={styles.roles}>
        {(
          [
            ["buyer", "Покупатель"],
            ["seller", "Продавец"],
            ["master", "Мастер"],
          ] as const
        ).map(([id, label]) => (
          <TouchableOpacity
            key={id}
            style={[styles.roleBtn, role === id && styles.roleActive]}
            onPress={() => setRole(id)}
          >
            <Text style={[styles.roleText, role === id && styles.roleTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Имя"
        value={fullName}
        onChangeText={setFullName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Телефон"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />
      {role === "master" && (
        <TextInput
          style={styles.input}
          placeholder="Район работы"
          value={district}
          onChangeText={setDistrict}
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="Пароль"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.btn} onPress={submit} disabled={loading}>
        <Text style={styles.btnText}>{loading ? "…" : "Зарегистрироваться"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { padding: spacing.lg },
  title: { fontSize: 24, fontWeight: "800", marginBottom: spacing.md },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 8, color: colors.gray700 },
  roles: { flexDirection: "row", gap: 8, marginBottom: 12, flexWrap: "wrap" },
  roleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  roleActive: { borderColor: colors.orange, backgroundColor: colors.orangeLight },
  roleText: { fontSize: 13, color: colors.gray700 },
  roleTextActive: { color: colors.orange, fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    fontSize: 16,
  },
  btn: {
    backgroundColor: colors.orange,
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: colors.white, fontWeight: "700", fontSize: 16 },
});
