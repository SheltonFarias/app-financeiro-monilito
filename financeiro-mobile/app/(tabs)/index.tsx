import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { DashboardData, getDashboard } from "@/lib/api";
import { labelMes, mesDaApi } from "@/lib/month";
import { theme } from "@/theme";

const moeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const total = (items: Array<{ valor: number }>) => items.reduce((sum, item) => sum + Number(item.valor || 0), 0);
const chaveCartao = (nome: string | null | undefined) => String(nome || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\bcartao\b/g, "").replace(/[^a-z0-9]/g, "");

export default function InicioScreen() {
  const mes = mesDaApi();
  const query = useQuery({ queryKey: ["dashboard", mes], queryFn: () => getDashboard(mes) });
  if (query.isLoading) return <View style={styles.center}><ActivityIndicator color={theme.blue} /></View>;
  if (query.isError) return <View style={styles.center}><Text style={styles.error}>{query.error.message}</Text></View>;
  const data = query.data as DashboardData;
  const receitas = total(data.receitas), gastos = total(data.gastosFixos) + total(data.gastosVariaveis);
  const cartoes = data.cartoes || [];
  return <ScrollView style={styles.page} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={query.refetch} tintColor={theme.blue} />}>
    <Text style={styles.month}>{labelMes()}</Text><Text style={styles.title}>Sua visão financeira</Text>
    <View style={styles.balance}><View style={styles.balanceHalo} /><Text style={styles.balanceLabel}>Saldo previsto</Text><Text style={styles.balanceValue}>{moeda(receitas - gastos)}</Text><Text style={styles.balanceNote}>Receitas menos compromissos do período</Text></View>
    <View style={styles.grid}><Metric label="Entradas" value={receitas} color={theme.emerald} /><Metric label="Saídas" value={gastos} color={theme.coral} /></View>
    <Text style={styles.section}>Composição do mês</Text><Metric label="Contas recorrentes" value={total(data.gastosFixos)} /><Metric label="Gastos variáveis" value={total(data.gastosVariaveis)} /><Metric label="Receitas confirmadas" value={receitas} color={theme.emerald} />
    {cartoes.length > 0 && <><Text style={styles.section}>Cartões e margem</Text>{cartoes.map((cartao) => <CardMargin key={cartao.id} cartao={cartao} fixos={data.gastosFixos} variaveis={data.gastosVariaveis} />)}</>}
  </ScrollView>;
}

function CardMargin({ cartao, fixos, variaveis }: { cartao: DashboardData["cartoes"][number]; fixos: DashboardData["gastosFixos"]; variaveis: DashboardData["gastosVariaveis"] }) {
  const chave = chaveCartao(cartao.nome);
  const previsto = [...fixos.filter((item) => chaveCartao(item.cartao) === chave), ...variaveis.filter((item) => chaveCartao(item.pagamento) === chave)].reduce((s, item) => s + Number(item.valor || 0), 0);
  const teto = Number(cartao.limite_planejado || cartao.limite_total || 0);
  const margem = teto - previsto;
  return <View style={[styles.cardMargin, margem < 0 && styles.cardMarginAlert]}><View><Text style={styles.metricLabel}>{cartao.nome}</Text><Text style={styles.cardMarginValue}>{moeda(previsto)} <Text style={styles.cardMarginLimit}>previstos de {moeda(teto)}</Text></Text></View><Text style={[styles.margin, margem < 0 ? styles.marginAlert : styles.marginSafe]}>{margem < 0 ? `${moeda(Math.abs(margem))} acima` : `${moeda(margem)} de margem`}</Text></View>;
}
function Metric({ label, value, color = theme.text }: { label: string; value: number; color?: string }) { return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={[styles.metricValue, { color }]}>{moeda(value)}</Text></View>; }
const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: theme.canvas }, content: { padding: 20, gap: 12, paddingBottom: 32 }, center: { flex: 1, backgroundColor: theme.canvas, alignItems: "center", justifyContent: "center", padding: 24 }, month: { color: theme.muted, textTransform: "capitalize", fontSize: 14, fontWeight: "600" }, title: { color: theme.text, fontWeight: "700", letterSpacing: -0.7, fontSize: 28, marginBottom: 10 }, balance: { overflow: "hidden", backgroundColor: theme.glassStrong, borderColor: "rgba(96, 180, 255, 0.32)", borderWidth: 1, padding: 22, borderRadius: 22, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 20, elevation: 5 }, balanceHalo: { position: "absolute", width: 190, height: 190, borderRadius: 95, backgroundColor: "rgba(58, 168, 255, 0.20)", right: -72, top: -105 }, balanceLabel: { color: "#B9D9FF", fontSize: 14, fontWeight: "600" }, balanceValue: { color: theme.text, fontWeight: "800", letterSpacing: -1.2, fontSize: 30, marginTop: 8 }, balanceNote: { color: theme.muted, fontSize: 12, marginTop: 10 }, grid: { flexDirection: "row", gap: 12 }, metric: { flex: 1, minHeight: 94, justifyContent: "space-between", backgroundColor: theme.glass, borderWidth: 1, borderColor: theme.line, padding: 15, borderRadius: 16 }, metricLabel: { color: theme.muted, fontSize: 12, fontWeight: "600" }, metricValue: { fontSize: 17, fontWeight: "700", letterSpacing: -0.3 }, section: { color: theme.text, fontSize: 17, fontWeight: "700", letterSpacing: -0.2, marginTop: 14 }, cardMargin: { backgroundColor: theme.glass, borderColor: theme.line, borderWidth: 1, borderRadius: 16, padding: 15, gap: 8 }, cardMarginAlert: { borderColor: "rgba(255, 124, 145, 0.48)", backgroundColor: "rgba(96, 27, 49, 0.38)" }, cardMarginValue: { color: theme.text, marginTop: 5, fontWeight: "700", fontSize: 16 }, cardMarginLimit: { color: theme.muted, fontSize: 12, fontWeight: "500" }, margin: { fontSize: 13, fontWeight: "700" }, marginSafe: { color: theme.emerald }, marginAlert: { color: theme.coral }, error: { color: theme.coral, textAlign: "center" } });
