/**
 * useAuth.js — Gerencia o estado de autenticação da sessão.
 * Usa o backend REST local para login (POST /api/auth/login → JWT).
 * Substitui a autenticação anterior via Google Apps Script.
 */
import { useState, useCallback } from "react";
import { loginApi, clearToken, setToken } from "../utils/apiService";

const SESSION_KEY = "fin2026_jwt";

/** Verifica se há JWT válido na sessão */
function getInitialAuth() {
  try {
    return !!sessionStorage.getItem(SESSION_KEY);
  } catch {
    return false;
  }
}

/**
 * @returns {{ isAuthenticated: boolean, login: Function, logout: Function }}
 */
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(getInitialAuth);

  /**
   * Autentica via API REST e salva o JWT.
   * @param {string} _email - Ignorado (sistema usa apenas senha)
   * @param {string} senha
   * @returns {Promise<{ ok: boolean, error?: string }>}
   */
  const login = useCallback(async (_email, senha) => {
    const result = await loginApi(senha);
    if (result.ok) {
      setIsAuthenticated(true);
    }
    return result;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, login, logout };
}
