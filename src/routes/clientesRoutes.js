const express = require('express');
const router = express.Router();

const clientesController = require('../controllers/clientesController');

// Criar e Alterar cliente e piscina
router.post('/salvar', clientesController.salvar);

// Rota para pesquisar cliente por cpf
router.get('/buscar', clientesController.buscar);

// Rota para listar todos os clientes
router.get('/listar', clientesController.listar);

module.exports = router;