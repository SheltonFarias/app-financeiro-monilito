import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";

export default function Index() {
  const { ready, authenticated } = useAuth();
  if (!ready) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#101827" }}><ActivityIndicator color="#2dd4bf" /></View>;
  return <Redirect href={authenticated ? "/(tabs)" : "/login"} />;
}
