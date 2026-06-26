/**
 * sheetsWriteService.js
 * Mantido por compatibilidade com imports existentes nas páginas.
 * Todas as funções agora são delegadas ao apiService.js (backend REST local).
 *
 * Anteriormente: integração com Google Apps Script via POST sem Content-Type.
 * Agora: chamadas REST autenticadas com JWT ao backend Node.js local.
 */
export {
  addRow,
  editRow,
  updateStatus,
  deleteRow,
  loginApi as callScript,
} from "./apiService";
