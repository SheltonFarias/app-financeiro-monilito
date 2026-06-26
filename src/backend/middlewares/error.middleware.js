/**
 * error.middleware.js — Handler global de erros do Express.
 * DEVE ser o último middleware registrado no app.js.
 *
 * Trata três categorias de erro:
 *   1. ZodError  → 400 com mensagens de validação detalhadas
 *   2. AppError  → statusCode definido no service
 *   3. Genérico  → 500 com mensagem genérica (stack nunca vaza ao cliente)
 */
const { ZodError } = require('zod');
const { AppError } = require('../utils/AppError');
const { sendError } = require('../utils/response');

/**
 * @param {Error} err
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next  — obrigatório para o Express reconhecer como error handler
 */
// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, next) => {
  // 1. Erros de validação Zod (schema inválido no body/query)
  if (err instanceof ZodError) {
    const messages = err.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join('; ');
    return sendError(res, `Dados inválidos: ${messages}`, 400);
  }

  // 2. Erros de negócio da aplicação (lançados nos services via AppError)
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode);
  }

  // 3. Erros inesperados — loga internamente, não expõe detalhes ao cliente
  console.error('[ERROR INESPERADO]', err);
  sendError(res, 'Ocorreu um erro interno no servidor.', 500);
};

module.exports = { errorMiddleware };
