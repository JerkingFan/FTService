import React, { useCallback, useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { DEMO_MODE } from "../../config";
import { api } from "../../api";
import { storage } from "../../storage";
import { colors } from "../../theme";

type TabKey = "Home" | "Favorites" | "Add" | "Chat" | "Profile";

const TAB_META: Record<
  TabKey,
  { label: string; icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap }
> = {
  Home: { label: "Главная", icon: "home-outline", iconActive: "home" },
  Favorites: { label: "Избранное", icon: "heart-outline", iconActive: "heart" },
  Add: { label: "Подать", icon: "add", iconActive: "add" },
  Chat: { label: "Чаты", icon: "chatbubbles-outline", iconActive: "chatbubbles" },
  Profile: { label: "Профиль", icon: "person-outline", iconActive: "person" },
};

function formatBadge(n: number): string {
  if (n <= 0) return "";
  if (n > 99) return "99+";
  return String(n);
}

function TabBadge({ text }: { text: string }) {
  if (!text) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{text}</Text>
    </View>
  );
}

export function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [favCount, setFavCount] = useState(0);
  const [chatUnread, setChatUnread] = useState(0);

  const loadCounts = useCallback(async () => {
    const [parts, masters] = await Promise.all([
      storage.getFavoritePartIds(),
      storage.getFavoriteMasterIds(),
    ]);
    setFavCount(parts.length + masters.length);
    try {
      const r = await api.getChatUnreadCount();
      setChatUnread(r.count);
    } catch {
      setChatUnread(0);
    }
  }, []);

  useEffect(() => {
    loadCounts();
  }, [loadCounts, state.index]);

  const bottomPad = Math.max(insets.bottom, Platform.OS === "android" ? 8 : 0);

  return (
    <View style={[styles.bar, { paddingBottom: bottomPad }]}>
      {state.routes.map((route, index) => {
        const key = route.name as TabKey;
        const focused = state.index === index;
        const meta = TAB_META[key];

        const onPress = () => {
          if (key === "Add") {
            (navigation as any).navigate("SubmitPart");
            return;
          }
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
          if (key === "Favorites" || key === "Chat") loadCounts();
        };

        if (key === "Add") {
          return (
            <Pressable key={route.key} style={styles.addSlot} onPress={onPress} accessibilityRole="button">
              <View style={styles.addBtn}>
                <Ionicons name="add" size={32} color="#fff" />
              </View>
              <View style={styles.addLabelRow}>
                <Text style={styles.addLabel}>Подать</Text>
                <Ionicons name="star" size={10} color={colors.star} style={styles.addStar} />
              </View>
            </Pressable>
          );
        }

        const active = focused;
        const iconName = active ? meta.iconActive : meta.icon;
        const tint = active ? colors.orange : colors.textMuted;

        let badge = "";
        if (key === "Favorites") {
          const n = favCount > 0 ? favCount : DEMO_MODE ? 18 : 0;
          badge = formatBadge(n);
        }
        if (key === "Chat") badge = formatBadge(chatUnread);

        return (
          <Pressable
            key={route.key}
            style={styles.tab}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
          >
            <View style={styles.iconWrap}>
              <Ionicons name={iconName} size={26} color={tint} />
              <TabBadge text={badge} />
            </View>
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
              {meta.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
    paddingTop: 6,
    minHeight: Platform.OS === "ios" ? 56 : 52,
    ...Platform.select({
      ios: {
        shadowColor: "#14171A",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 12 },
    }),
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 2,
    minHeight: 48,
  },
  iconWrap: {
    width: 32,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textMuted,
    marginTop: 2,
  },
  labelActive: {
    color: colors.orange,
    fontWeight: "700",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -14,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: colors.red,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 12,
  },
  addSlot: {
    flex: 1,
    alignItems: "center",
    marginTop: -22,
  },
  addBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.orange,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: colors.orangeDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: { elevation: 10 },
    }),
  },
  addLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 2,
  },
  addLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.text,
  },
  addStar: {
    marginTop: -1,
  },
});
