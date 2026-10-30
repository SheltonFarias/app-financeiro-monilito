import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import { theme } from "@/theme";

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
    <Text style={styles.eyebrow}>CONTROLE FINANCEIRO</Text><Text style={styles.title}>Seu dinheiro, em perspectiva.</Text>
    <Text style={styles.subtitle}>Entre para acompanhar suas finanças com clareza.</Text>
    <Text style={styles.label}>Senha</Text>
    <TextInput value={senha} onChangeText={setSenha} secureTextEntry placeholder="Sua senha" placeholderTextColor="#718096" style={styles.input} onSubmitEditing={entrar} />
    <Pressable disabled={loading || !senha.trim()} onPress={entrar} style={({ pressed }) => [styles.button, (loading || !senha.trim()) && styles.disabled, pressed && styles.pressed]}><Text style={styles.buttonText}>{loading ? "Entrando..." : "Entrar"}</Text></Pressable>
  </View></KeyboardAvoidingView>;
}
const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: theme.canvas, justifyContent: "center", padding: 24 }, card: { backgroundColor: theme.glassStrong, borderWidth: 1, borderColor: theme.line, borderRadius: 24, padding: 24, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 28, elevation: 8 }, eyebrow: { color: theme.blue, fontWeight: "800", fontSize: 11, letterSpacing: 1.1 }, title: { color: theme.text, letterSpacing: -0.8, fontSize: 29, fontWeight: "700", marginTop: 12 }, subtitle: { color: theme.muted, marginTop: 8, marginBottom: 28, lineHeight: 20 }, label: { color: theme.text, fontWeight: "600", marginBottom: 8 }, input: { color: theme.text, backgroundColor: "rgba(3, 10, 24, 0.42)", borderWidth: 1, borderColor: theme.line, borderRadius: 14, padding: 14 }, button: { backgroundColor: theme.blueDark, padding: 15, alignItems: "center", borderRadius: 14, marginTop: 20 }, buttonText: { color: "#FFF", fontWeight: "800" }, disabled: { opacity: 0.5 }, pressed: { opacity: 0.8 } });
