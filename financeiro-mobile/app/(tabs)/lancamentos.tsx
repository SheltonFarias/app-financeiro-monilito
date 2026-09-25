import { StyleSheet, Text, View } from "react-native";
export default function LancamentosScreen() { return <View style={styles.page}><Text style={styles.title}>Lançamentos</Text><Text style={styles.text}>A criação e edição de gastos e receitas será a próxima entrega do MVP.</Text></View>; }
const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: "#101827", padding: 20 }, title: { color: "#f8fafc", fontSize: 26, fontWeight: "700" }, text: { color: "#94a3b8", marginTop: 10, lineHeight: 21 } });
