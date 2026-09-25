const { Router } = require('express');
const { authMiddleware } = require('../../middlewares/auth.middleware');
const { carregarDados, carregarHistorico } = require('./dashboard.controller');

const router = Router();

router.use(authMiddleware);

// GET /api/dashboard?mes=Junho2026 — dados do mês
router.get('/', carregarDados);

// GET /api/dashboard/historico — todos os dados históricos
router.get('/historico', carregarHistorico);

module.exports = router;
