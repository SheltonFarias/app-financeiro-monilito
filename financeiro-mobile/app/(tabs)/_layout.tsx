import { Tabs } from "expo-router";
import { theme } from "@/theme";

export default function TabsLayout() {
  return <Tabs screenOptions={{ headerStyle: { backgroundColor: theme.canvas }, headerShadowVisible: false, headerTintColor: theme.text, headerTitleStyle: { fontWeight: "700" }, tabBarStyle: { backgroundColor: theme.canvasRaised, borderTopColor: theme.line }, tabBarActiveTintColor: theme.blue, tabBarInactiveTintColor: theme.muted }}>
    <Tabs.Screen name="index" options={{ title: "Início" }} />
    <Tabs.Screen name="lancamentos" options={{ title: "Lançamentos" }} />
    <Tabs.Screen name="ajustes" options={{ title: "Ajustes" }} />
  </Tabs>;
}
