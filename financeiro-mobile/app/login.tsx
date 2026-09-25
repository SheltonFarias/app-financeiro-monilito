import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";

export default function LoginScreen() {
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const entrar = async () => {
    if (!senha.trim()) return;
    setLoading(true);
    try { await login(senha); router.replace("/(tabs)"); }
    catch (error) { Alert.alert("Não foi possível entrar", error instanceof Error ? error.message : "Tente novamente."); }
    finally { setLoading(false); }
  };
  return <KeyboardAvoidingView behavior={Platform.select({ ios: "padding", default: undefined })} style={styles.page}><View style={styles.card}>
    <Text style={styles.eyebrow}>CONTROLE FINANCEIRO</Text><Text style={styles.title}>Bem-vindo de volta</Text>
    <Text style={styles.subtitle}>Entre para acompanhar suas finanças.</Text>
    <Text style={styles.label}>Senha</Text>
    <TextInput value={senha} onChangeText={setSenha} secureTextEntry placeholder="Sua senha" placeholderTextColor="#718096" style={styles.input} onSubmitEditing={entrar} />
    <Pressable disabled={loading || !senha.trim()} onPress={entrar} style={({ pressed }) => [styles.button, (loading || !senha.trim()) && styles.disabled, pressed && styles.pressed]}><Text style={styles.buttonText}>{loading ? "Entrando..." : "Entrar"}</Text></Pressable>
  </View></KeyboardAvoidingView>;
}
const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: "#101827", justifyContent: "center", padding: 24 }, card: { backgroundColor: "#172033", borderRadius: 20, padding: 24 }, eyebrow: { color: "#2dd4bf", fontWeight: "700", fontSize: 12, letterSpacing: 1.2 }, title: { color: "#f8fafc", fontSize: 28, fontWeight: "700", marginTop: 12 }, subtitle: { color: "#a0aec0", marginTop: 8, marginBottom: 28 }, label: { color: "#cbd5e1", fontWeight: "600", marginBottom: 8 }, input: { color: "#f8fafc", backgroundColor: "#0f172a", borderWidth: 1, borderColor: "#334155", borderRadius: 12, padding: 14 }, button: { backgroundColor: "#14b8a6", padding: 15, alignItems: "center", borderRadius: 12, marginTop: 20 }, buttonText: { color: "#042f2e", fontWeight: "800" }, disabled: { opacity: 0.5 }, pressed: { opacity: 0.8 } });
