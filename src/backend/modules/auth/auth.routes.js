/**
 * auth.routes.js — Rotas de autenticação.
 */
const { Router } = require('express');
const { authMiddleware } = require('../../middlewares/auth.middleware');
const { login, ping } = require('./auth.controller');

const router = Router();

// Rota pública: login não requer token
router.post('/login', login);

// Rota protegida: verifica se o token ainda é válido
router.get('/ping', authMiddleware, ping);

module.exports = router;
