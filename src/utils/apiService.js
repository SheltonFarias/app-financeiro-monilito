/**
 * apiService.js — Integração com o Backend REST local.
 * Substitui sheetsWriteService.js (Google Apps Script).
 *
 * - Usa JWT no header Authorization: Bearer <token>
 * - Normaliza campos snake_case do banco → camelCase do frontend
 * - Expõe as mesmas funções públicas que sheetsWriteService exportava,
 *   mais funções novas para operações com IDs
 */

const API_URL = "";
const SESSION_KEY = "fin2026_jwt";

// ── Helpers internos ──────────────────────────────────────────────────────

/** Retorna o JWT salvo na sessão */
function getToken() {
  try {
    return sessionStorage.getItem(SESSION_KEY) || "";
  } catch {
    return "";
  }
}

/** Salva o JWT na sessão */
export function setToken(token) {
  try {
    sessionStorage.setItem(SESSION_KEY, token);
  } catch { /* ignore */ }
}

/** Remove o JWT da sessão (logout) */
export function clearToken() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch { /* ignore */ }
}

/**
 * Realiza uma requisição autenticada para a API.
 * @param {string} path   - Ex: "/api/dashboard?mes=Junho2026"
 * @param {RequestInit} [options] - Opções do fetch
 * @returns {Promise<any>} O campo `data` da resposta
 */
async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error(`Erro de rede ao chamar ${path}: resposta não é JSON.`);
  }

  if (!res.ok || json.success === false) {
    throw new Error(json.error || `Erro HTTP ${res.status}`);
  }

  return json.data;
}

// ── Normalização de campos snake_case → camelCase ─────────────────────────

/**
 * Normaliza um investimento retornado pelo banco (snake_case → camelCase).
 * @param {Object} inv
 */
function normalizeInvestimento(inv) {
  if (!inv) return inv;
  return {
    ...inv,
    precoMedio: inv.preco_medio ?? inv.precoMedio ?? 0,
    dataCompra: inv.data_compra ?? inv.dataCompra ?? null,
    // Mantém os campos originais para compatibilidade
    preco_medio: undefined,
    data_compra: undefined,
  };
}

/**
 * Normaliza um gasto variável retornado pelo banco.
 * @param {Object} gv
 */
function normalizeGastoVariavel(gv) {
  if (!gv) return gv;
  return {
    ...gv,
    dataCompra: gv.data_compra ?? gv.dataCompra ?? null,
    data_compra: undefined,
  };
}

// ── Autenticação ──────────────────────────────────────────────────────────

/**
 * Autentica o usuário na API e salva o JWT.
 * Substitui: callScript({ action: "ping", token: senha })
 *
 * @param {string} senha
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function loginApi(senha) {
  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senha }),
    });

    const json = await res.json();
    if (!res.ok || json.success === false) {
      return { ok: false, error: json.error || "Senha incorreta ou erro de rede." };
    }

    setToken(json.data.token);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: "Erro de rede: " + err.message };
  }
}

// ── Dashboard (substitui loadData) ────────────────────────────────────────

/**
 * Carrega todos os dados do mês para o dashboard.
 * Substitui: callScript({ action: "loadData" })
 *
 * @param {string} mes - Ex: "Junho2026"
 * @returns {Promise<{ gastosFixos, gastosVariaveis, receitas, investimentos }>}
 */
export async function fetchAllData(mes) {
  const dados = await apiFetch(`/api/dashboard?mes=${encodeURIComponent(mes)}`);
  return {
    gastosFixos:     dados.gastosFixos     || [],
    gastosVariaveis: (dados.gastosVariaveis || []).map(normalizeGastoVariavel),
    receitas:        dados.receitas        || [],
    investimentos:   (dados.investimentos  || []).map(normalizeInvestimento),
  };
}

// ── CRUD: Gastos Fixos ────────────────────────────────────────────────────

/** POST /api/gastos-fixos */
export async function addGastoFixo(dados) {
  return apiFetch("/api/gastos-fixos", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

/** PUT /api/gastos-fixos/:id */
export async function editGastoFixo(id, dados) {
  return apiFetch(`/api/gastos-fixos/${id}`, {
    method: "PUT",
    body: JSON.stringify(dados),
  });
}

/** PATCH /api/gastos-fixos/:id/status */
export async function updateGastoFixoStatus(id, situacao) {
  return apiFetch(`/api/gastos-fixos/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ situacao }),
  });
}

/** DELETE /api/gastos-fixos/:id */
export async function deleteGastoFixo(id) {
  return apiFetch(`/api/gastos-fixos/${id}`, { method: "DELETE" });
}

// ── CRUD: Gastos Variáveis ────────────────────────────────────────────────

/** POST /api/gastos-variaveis */
export async function addGastoVariavel(dados) {
  return apiFetch("/api/gastos-variaveis", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

/** PUT /api/gastos-variaveis/:id */
export async function editGastoVariavel(id, dados) {
  return apiFetch(`/api/gastos-variaveis/${id}`, {
    method: "PUT",
    body: JSON.stringify(dados),
  });
}

/** PATCH /api/gastos-variaveis/:id/status */
export async function updateGastoVariavelStatus(id, situacao) {
  return apiFetch(`/api/gastos-variaveis/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ situacao }),
  });
}

/** DELETE /api/gastos-variaveis/:id */
export async function deleteGastoVariavel(id) {
  return apiFetch(`/api/gastos-variaveis/${id}`, { method: "DELETE" });
}

// ── CRUD: Receitas ────────────────────────────────────────────────────────

/** POST /api/receitas */
export async function addReceita(dados) {
  return apiFetch("/api/receitas", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

/** PUT /api/receitas/:id */
export async function editReceita(id, dados) {
  return apiFetch(`/api/receitas/${id}`, {
    method: "PUT",
    body: JSON.stringify(dados),
  });
}

/** PATCH /api/receitas/:id/status */
export async function updateReceitaStatus(id, situacao) {
  return apiFetch(`/api/receitas/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ situacao }),
  });
}

/** DELETE /api/receitas/:id */
export async function deleteReceita(id) {
  return apiFetch(`/api/receitas/${id}`, { method: "DELETE" });
}

// ── CRUD: Investimentos ───────────────────────────────────────────────────

/** POST /api/investimentos */
export async function addInvestimento(dados) {
  return apiFetch("/api/investimentos", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

/** PUT /api/investimentos/:id */
export async function editInvestimento(id, dados) {
  return apiFetch(`/api/investimentos/${id}`, {
    method: "PUT",
    body: JSON.stringify(dados),
  });
}

/** DELETE /api/investimentos/:id */
export async function deleteInvestimento(id) {
  return apiFetch(`/api/investimentos/${id}`, { method: "DELETE" });
}

// ── Mapeamento de aba → funções de CRUD ──────────────────────────────────
// Mantém compatibilidade com as páginas que chamam addRow/editRow/deleteRow/updateStatus

const ABA_ADD = {
  gastos_fixos:     addGastoFixo,
  gastos_variaveis: addGastoVariavel,
  receitas:         addReceita,
  investimentos:    addInvestimento,
};

const ABA_EDIT = {
  gastos_fixos:     editGastoFixo,
  gastos_variaveis: editGastoVariavel,
  receitas:         editReceita,
  investimentos:    editInvestimento,
};

const ABA_UPDATE_STATUS = {
  gastos_fixos:     updateGastoFixoStatus,
  gastos_variaveis: updateGastoVariavelStatus,
  receitas:         updateReceitaStatus,
};

const ABA_DELETE = {
  gastos_fixos:     deleteGastoFixo,
  gastos_variaveis: deleteGastoVariavel,
  receitas:         deleteReceita,
  investimentos:    deleteInvestimento,
};

/**
 * Adiciona uma nova linha em uma das tabelas.
 * Compatível com a assinatura de sheetsWriteService.addRow().
 *
 * @param {string} aba   - "gastos_fixos" | "gastos_variaveis" | "receitas" | "investimentos"
 * @param {Object} dados
 */
export async function addRow(aba, dados) {
  const fn = ABA_ADD[aba];
  if (!fn) throw new Error(`Aba desconhecida: ${aba}`);
  return fn(dados);
}

/**
 * Edita uma linha existente pelo ID (campo `id` deve estar em chaveAntiga ou novosDados).
 *
 * @param {string} aba
 * @param {Object} chaveAntiga - Objeto da linha anterior (deve conter `id`)
 * @param {Object} novosDados
 */
export async function editRow(aba, chaveAntiga, novosDados) {
  const fn = ABA_EDIT[aba];
  if (!fn) throw new Error(`Aba desconhecida: ${aba}`);
  const id = chaveAntiga.id;
  if (!id) throw new Error(`editRow: campo "id" não encontrado em chaveAntiga.`);
  return fn(id, novosDados);
}

/**
 * Atualiza o campo situação de uma linha pelo ID.
 *
 * @param {string} aba
 * @param {Object} chave      - Objeto da linha (deve conter `id`)
 * @param {string} novoStatus
 */
export async function updateStatus(aba, chave, novoStatus) {
  const fn = ABA_UPDATE_STATUS[aba];
  if (!fn) throw new Error(`Aba não suporta updateStatus: ${aba}`);
  const id = chave.id;
  if (!id) throw new Error(`updateStatus: campo "id" não encontrado em chave.`);
  return fn(id, novoStatus);
}

/**
 * Remove uma linha pelo ID.
 *
 * @param {string} aba
 * @param {Object} chave - Objeto da linha (deve conter `id`)
 */
export async function deleteRow(aba, chave) {
  const fn = ABA_DELETE[aba];
  if (!fn) throw new Error(`Aba desconhecida: ${aba}`);
  const id = chave.id;
  if (!id) throw new Error(`deleteRow: campo "id" não encontrado em chave.`);
  return fn(id);
}
