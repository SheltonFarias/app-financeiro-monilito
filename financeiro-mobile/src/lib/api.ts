import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "financeiro.jwt";
const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");

type ApiResponse<T> = { success: boolean; data: T; error?: string };

export class ApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}, authenticated = true): Promise<T> {
  if (!API_URL) throw new ApiError("Defina EXPO_PUBLIC_API_URL no arquivo .env.");
  const token = authenticated ? await getToken() : null;
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
  const body = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !body.success) throw new ApiError(body.error || "Não foi possível concluir a operação.", response.status);
  return body.data;
}

export async function login(senha: string) {
  const data = await request<{ token: string }>("/api/auth/login", { method: "POST", body: JSON.stringify({ senha }) }, false);
  await SecureStore.setItemAsync(TOKEN_KEY, data.token);
}

export function getToken() { return SecureStore.getItemAsync(TOKEN_KEY); }
export function logout() { return SecureStore.deleteItemAsync(TOKEN_KEY); }

export type DashboardData = {
  gastosFixos: Array<{ id: number; descricao: string; valor: number; situacao: string }>;
  gastosVariaveis: Array<{ id: number; descricao: string; valor: number; situacao: string }>;
  receitas: Array<{ id: number; descricao: string; valor: number; situacao: string }>;
  metas: Array<{ id: number; titulo: string; valor_alvo: number; valor_atual: number }>;
};

export function getDashboard(mes: string) { return request<DashboardData>(`/api/dashboard?mes=${encodeURIComponent(mes)}`); }
