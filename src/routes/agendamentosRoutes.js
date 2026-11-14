
const express = require('express');
const router = express.Router();

const agendamentosController = require('../controllers/agendamentosController');

// Listar todos os agendamentos
router.get('/', agendamentosController.listar);

// Buscar agendamento pelo ID
router.get('/:id', agendamentosController.buscarPorId);

// Criar ou atualizar agendamento
router.post('/', agendamentosController.salvar);

// Excluir agendamento
router.delete('/:id', agendamentosController.excluir);

module.exports = router;
