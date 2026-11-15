const express = require('express');
const router = express.Router();

const relatoriosController = require('../controllers/relatoriosController');

router.get('/periodos', relatoriosController.listarPeriodos);
router.get('/clientes', relatoriosController.listarClientes);
router.get('/manutencoes', relatoriosController.listarManutencoes);
router.get('/consumo', relatoriosController.listarConsumo);
router.get('/clientes/:idCliente/historico', relatoriosController.listarHistoricoCliente);
router.get('/agenda', relatoriosController.listarAgenda);

module.exports = router;
