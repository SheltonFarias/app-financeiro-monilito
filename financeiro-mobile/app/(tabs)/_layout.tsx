import { Tabs } from "expo-router";

export default function TabsLayout() {
  return <Tabs screenOptions={{ headerStyle: { backgroundColor: "#101827" }, headerTintColor: "#f8fafc", tabBarStyle: { backgroundColor: "#172033", borderTopColor: "#243046" }, tabBarActiveTintColor: "#2dd4bf", tabBarInactiveTintColor: "#94a3b8" }}>
    <Tabs.Screen name="index" options={{ title: "Início" }} />
    <Tabs.Screen name="lancamentos" options={{ title: "Lançamentos" }} />
    <Tabs.Screen name="ajustes" options={{ title: "Ajustes" }} />
  </Tabs>;
}
