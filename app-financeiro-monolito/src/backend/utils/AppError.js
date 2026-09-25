/**
 * AppError.js — Erro customizado da aplicação com código HTTP.
 * Use nos services para sinalizar erros esperados (negócio) ao middleware de erro.
 * O errorMiddleware captura essa classe e retorna o statusCode correto ao cliente.
 */
class AppError extends Error {
  /**
   * @param {string} message   - Mensagem legível ao usuário
   * @param {number} statusCode - Código HTTP (400, 401, 404, 409, 422, 500…)
   */
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
    // Mantém o stack trace limpo em ambientes Node.js
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

module.exports = { AppError };
