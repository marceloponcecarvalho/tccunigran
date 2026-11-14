const express = require('express');
const router = express.Router();

const manutencaoController = require('../controllers/manutencaoController');

// Listar agendamentos disponíveis
router.get('/agendamentos', manutencaoController.listarAgendamentosDisponiveis);

// Calcular dosagens sem registrar a manutenção
router.post('/calcular', manutencaoController.calcular);

// Registrar manutenção e atualizar estoque
router.post('/salvar', manutencaoController.salvar);

module.exports = router;
