import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "../theme";

export type FilterValues = {
  condition: "all" | "used" | "new";
  minPrice: string;
  maxPrice: string;
  location: string;
  verifiedOnly: boolean;
  dateFrom: string;
  dateTo: string;
};

export const EMPTY_FILTERS: FilterValues = {
  condition: "all",
  minPrice: "",
  maxPrice: "",
  location: "",
  verifiedOnly: false,
  dateFrom: "",
  dateTo: "",
};

interface Props {
  visible: boolean;
  values: FilterValues;
  onChange: (patch: Partial<FilterValues>) => void;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
}

export function FiltersModal({ visible, values, onChange, onClose, onApply, onReset }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>Фильтр</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
          <Text style={styles.label}>Дата публикации</Text>
          <View style={styles.dateRow}>
            <TextInput
              value={values.dateFrom}
              onChangeText={(dateFrom) => onChange({ dateFrom })}
              placeholder="с (дд.мм.гг)"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
            <Text style={styles.dash}>—</Text>
            <TextInput
              value={values.dateTo}
              onChangeText={(dateTo) => onChange({ dateTo })}
              placeholder="по"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
          </View>

          <Text style={styles.label}>Состояние</Text>
          <View style={styles.pillRow}>
            {(["all", "used", "new"] as const).map((c) => (
              <Pressable
                key={c}
                style={[styles.pill, values.condition === c && styles.pillActive]}
                onPress={() => onChange({ condition: c })}
              >
                <Text style={[styles.pillText, values.condition === c && styles.pillTextActive]}>
                  {c === "all" ? "Любое" : c === "used" ? "Б/У" : "Новая"}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Цена, сом</Text>
          <View style={styles.dateRow}>
            <TextInput
              value={values.minPrice}
              onChangeText={(minPrice) => onChange({ minPrice })}
              placeholder="от"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              style={styles.input}
            />
            <TextInput
              value={values.maxPrice}
              onChangeText={(maxPrice) => onChange({ maxPrice })}
              placeholder="до"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              style={styles.input}
            />
          </View>

          <Text style={styles.label}>Район / место</Text>
          <TextInput
            value={values.location}
            onChangeText={(location) => onChange({ location })}
            placeholder="Бишкек, район…"
            placeholderTextColor={colors.textMuted}
            style={styles.fullInput}
          />

          <Pressable style={styles.toggleRow} onPress={() => onChange({ verifiedOnly: !values.verifiedOnly })}>
            <View style={[styles.checkbox, values.verifiedOnly && styles.checkboxOn]}>
              {values.verifiedOnly ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
            </View>
            <Text style={styles.toggleText}>Только проверенные</Text>
          </Pressable>

          <View style={styles.btns}>
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={onReset}>
              <Text style={styles.btnGhostText}>Сбросить</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnPrimary]} onPress={onApply}>
              <Text style={styles.btnPrimaryText}>Показать</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(20,23,26,0.45)" },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: "88%",
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  title: { ...typography.h2, fontSize: 18 },
  body: { padding: spacing.md, paddingBottom: spacing.xxl },
  label: { fontSize: 13, fontWeight: "700", color: colors.textMuted, marginTop: 12, marginBottom: 8 },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dash: { color: colors.textMuted, fontSize: 16 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  fullInput: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  pillActive: { backgroundColor: colors.orangeSoft, borderColor: colors.orange },
  pillText: { fontSize: 14, fontWeight: "600", color: colors.textSecondary },
  pillTextActive: { color: colors.orange },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 16 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: { backgroundColor: colors.orange, borderColor: colors.orange },
  toggleText: { fontSize: 15, color: colors.text },
  btns: { flexDirection: "row", gap: 10, marginTop: 20 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: radius.lg, alignItems: "center" },
  btnGhost: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.borderLight },
  btnPrimary: { backgroundColor: colors.orange },
  btnGhostText: { fontSize: 16, fontWeight: "700", color: colors.textSecondary },
  btnPrimaryText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});
