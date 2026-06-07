import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "../../theme";

type Item = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  badge?: number;
  onPress: () => void;
};

interface Props {
  open: boolean;
  onClose: () => void;
  headerTitle?: string;
  items: Item[];
}

export function SideDrawer({ open, onClose, headerTitle = "FTservice", items }: Props) {
  const translateX = useRef(new Animated.Value(-320)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: open ? 0 : -320,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdrop, {
        toValue: open ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [open, translateX, backdrop]);

  const data = useMemo(() => items, [items]);

  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdrop }]} />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View style={[styles.sheet, { transform: [{ translateX }] }]}>
          <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>FT</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{headerTitle}</Text>
                <Text style={styles.sub}>Меню</Text>
              </View>
              <Pressable onPress={onClose} hitSlop={10}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </Pressable>
            </View>

            <View style={styles.list}>
              {data.map((it) => (
                <Pressable
                  key={it.label}
                  style={({ pressed }) => [styles.item, pressed && styles.pressed]}
                  onPress={() => {
                    onClose();
                    it.onPress();
                  }}
                >
                  <Ionicons name={it.icon} size={20} color={colors.textSecondary} />
                  <Text style={styles.label}>{it.label}</Text>
                  {typeof it.badge === "number" ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{it.badge}</Text>
                    </View>
                  ) : null}
                </Pressable>
              ))}
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 320,
    backgroundColor: colors.surface,
    borderTopRightRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    overflow: "hidden",
  },
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  logo: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: "#fff", fontWeight: "800" },
  title: { fontSize: 16, fontWeight: "800", color: colors.text },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  list: { padding: spacing.md, gap: 2 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: radius.md,
  },
  pressed: { backgroundColor: colors.bg },
  label: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.text },
  badge: {
    minWidth: 24,
    paddingHorizontal: 8,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontWeight: "800", fontSize: 12 },
});

