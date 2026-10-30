import { StyleSheet, Text, View } from "react-native";
import { theme } from "@/theme";

export default function LancamentosScreen() {
  return <View style={styles.page}>
    <Text style={styles.title}>Lançamentos</Text>
    <View style={styles.empty}>
      <Text style={styles.eyebrow}>EM BREVE</Text>
      <Text style={styles.emptyTitle}>Registre o que move seu mês</Text>
      <Text style={styles.text}>A criação e edição de gastos e receitas será a próxima entrega do MVP.</Text>
    </View>
  </View>;
}

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: theme.canvas, padding: 20 }, title: { color: theme.text, fontSize: 28, letterSpacing: -0.7, fontWeight: "700" }, empty: { marginTop: 18, padding: 20, borderRadius: 20, backgroundColor: theme.glass, borderWidth: 1, borderColor: theme.line }, eyebrow: { color: theme.blue, fontSize: 11, fontWeight: "800", letterSpacing: 1 }, emptyTitle: { color: theme.text, marginTop: 12, fontWeight: "700", fontSize: 18 }, text: { color: theme.muted, marginTop: 8, lineHeight: 21 } });
