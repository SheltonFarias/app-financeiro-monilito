/**
 * response.js — Helpers para respostas HTTP padronizadas.
 * Garante que TODAS as respostas da API sigam o mesmo formato JSON:
 *   { success: true,  data: ... }
 *   { success: false, error: "..." }
 */

/**
 * Envia uma resposta de sucesso padronizada.
 * @param {import('express').Response} res
 * @param {*} data         - Payload da resposta
 * @param {number} [statusCode=200] - Código HTTP
 */
const sendSuccess = (res, data, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

/**
 * Envia uma resposta de erro padronizada.
 * @param {import('express').Response} res
 * @param {string} message   - Mensagem de erro legível ao usuário
 * @param {number} [statusCode=500] - Código HTTP
 */
const sendError = (res, message, statusCode = 500) =>
  res.status(statusCode).json({ success: false, error: message });

module.exports = { sendSuccess, sendError };
