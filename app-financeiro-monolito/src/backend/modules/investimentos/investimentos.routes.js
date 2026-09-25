const { Router } = require('express');
const { authMiddleware } = require('../../middlewares/auth.middleware');
const ctrl = require('./investimentos.controller');

const router = Router();

router.use(authMiddleware);

router.get('/',    ctrl.listar);
router.post('/',   ctrl.criar);
router.put('/:id', ctrl.atualizar);
router.delete('/:id', ctrl.remover);

module.exports = router;
