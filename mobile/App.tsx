import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import * as Font from "expo-font";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "./src/context/AuthContext";
import { CityProvider } from "./src/context/CityContext";
import { BottomTabBar } from "./src/components/navigation/BottomTabBar";
import type { RootStackParamList, TabParamList } from "./src/navigation/types";
import { HomeScreen } from "./src/screens/HomeScreen";
import { MastersScreen } from "./src/screens/MastersScreen";
import { MessagesScreen } from "./src/screens/MessagesScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { PartDetailScreen } from "./src/screens/PartDetailScreen";
import { BookingScreen } from "./src/screens/BookingScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { RegisterScreen } from "./src/screens/RegisterScreen";
import { SubmitPartScreen } from "./src/screens/SubmitPartScreen";
import { PartsFeedScreen } from "./src/screens/PartsFeedScreen";
import { FavoritesScreen } from "./src/screens/FavoritesScreen";
import { ChatScreen } from "./src/screens/ChatScreen";
import { colors } from "./src/theme";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function AddPlaceholder() {
  return <View />;
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
      <Tab.Screen name="Add" component={AddPlaceholder} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppNavigation() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: "700", fontSize: 17 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="Masters" component={MastersScreen} options={{ title: "Мастера" }} />
        <Stack.Screen name="Messages" component={MessagesScreen} options={{ title: "Сообщения" }} />
        <Stack.Screen name="Parts" component={PartsFeedScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="PartDetail"
          component={PartDetailScreen}
          options={{ title: "Объявление", headerBackTitle: "Назад" }}
        />
        <Stack.Screen
          name="Booking"
          component={BookingScreen}
          options={{ title: "Запись", presentation: "modal" }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: "Вход", presentation: "modal" }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ title: "Регистрация", presentation: "modal" }}
        />
        <Stack.Screen
          name="SubmitPart"
          component={SubmitPartScreen}
          options={{ title: "Новое объявление", presentation: "modal" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await Font.loadAsync({
          ionicons: require("./assets/fonts/ionicons.ttf"),
        });
      } catch {
        // Android: шрифт также лежит в android/app/src/main/assets/fonts/ionicons.ttf
      }
      if (alive) setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={colors.orange} />
      </View>
    );
  }

  return (
    <CityProvider>
      <AuthProvider>
        <AppNavigation />
      </AuthProvider>
    </CityProvider>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
});
