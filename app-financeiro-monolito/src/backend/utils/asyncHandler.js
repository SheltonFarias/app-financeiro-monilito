/**
 * asyncHandler.js — Wrapper que captura erros de funções async em controllers
 * e os encaminha ao middleware de erro global via next().
 * Elimina a necessidade de try/catch repetitivo em cada controller.
 *
 * @param {Function} fn - Função async do controller
 * @returns {import('express').RequestHandler} Middleware Express
 *
 * @example
 * router.get('/', asyncHandler(async (req, res) => {
 *   const data = await service.listar();
 *   res.json(data);
 * }));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { asyncHandler };
