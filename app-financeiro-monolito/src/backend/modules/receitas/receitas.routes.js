const { Router } = require('express');
const { authMiddleware } = require('../../middlewares/auth.middleware');
const ctrl = require('./receitas.controller');

const router = Router();

router.use(authMiddleware);

router.get('/',              ctrl.listar);
router.post('/',             ctrl.criar);
router.put('/:id',           ctrl.atualizar);
router.patch('/:id/status',  ctrl.atualizarStatus);
router.delete('/:id/serie',  ctrl.removerSerie);
router.delete('/:id',        ctrl.remover);

module.exports = router;
