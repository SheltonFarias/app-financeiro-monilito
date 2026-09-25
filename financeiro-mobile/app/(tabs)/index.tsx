import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { DashboardData, getDashboard } from "@/lib/api";
import { labelMes, mesDaApi } from "@/lib/month";

const moeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const total = (items: Array<{ valor: number }>) => items.reduce((sum, item) => sum + Number(item.valor || 0), 0);

export default function InicioScreen() {
  const mes = mesDaApi();
  const query = useQuery({ queryKey: ["dashboard", mes], queryFn: () => getDashboard(mes) });
  if (query.isLoading) return <View style={styles.center}><ActivityIndicator color="#2dd4bf" /></View>;
  if (query.isError) return <View style={styles.center}><Text style={styles.error}>{query.error.message}</Text></View>;
  const data = query.data as DashboardData;
  const receitas = total(data.receitas), gastos = total(data.gastosFixos) + total(data.gastosVariaveis);
  return <ScrollView style={styles.page} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={query.refetch} tintColor="#2dd4bf" />}>
    <Text style={styles.month}>{labelMes()}</Text><Text style={styles.title}>Resumo do mês</Text>
    <View style={styles.balance}><Text style={styles.balanceLabel}>Saldo previsto</Text><Text style={styles.balanceValue}>{moeda(receitas - gastos)}</Text></View>
    <View style={styles.grid}><Metric label="Receitas" value={receitas} color="#34d399" /><Metric label="Gastos" value={gastos} color="#fb7185" /></View>
    <Text style={styles.section}>Lançamentos</Text><Metric label="Gastos fixos" value={total(data.gastosFixos)} /><Metric label="Gastos variáveis" value={total(data.gastosVariaveis)} /><Metric label="Receitas do mês" value={receitas} />
  </ScrollView>;
}
function Metric({ label, value, color = "#f8fafc" }: { label: string; value: number; color?: string }) { return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={[styles.metricValue, { color }]}>{moeda(value)}</Text></View>; }
const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: "#101827" }, content: { padding: 20, gap: 12 }, center: { flex: 1, backgroundColor: "#101827", alignItems: "center", justifyContent: "center", padding: 24 }, month: { color: "#94a3b8", textTransform: "capitalize" }, title: { color: "#f8fafc", fontWeight: "700", fontSize: 27, marginBottom: 8 }, balance: { backgroundColor: "#0f766e", padding: 20, borderRadius: 18 }, balanceLabel: { color: "#ccfbf1", fontSize: 14 }, balanceValue: { color: "#fff", fontWeight: "800", fontSize: 29, marginTop: 8 }, grid: { flexDirection: "row", gap: 12 }, metric: { flex: 1, minHeight: 86, justifyContent: "space-between", backgroundColor: "#172033", padding: 14, borderRadius: 14 }, metricLabel: { color: "#94a3b8", fontSize: 13 }, metricValue: { fontSize: 17, fontWeight: "700" }, section: { color: "#f8fafc", fontSize: 18, fontWeight: "700", marginTop: 14 }, error: { color: "#fecaca", textAlign: "center" } });
