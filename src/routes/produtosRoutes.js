const express = require('express');
const router = express.Router();

const produtosController = require('../controllers/produtosController');

// Listar todos os produtos
router.get('/listar', produtosController.listar);

// Buscar produto pelo tipo
router.get('/buscar', produtosController.buscar);

// Atualizar quantidade em estoque
router.put('/atualizar', produtosController.atualizar);

module.exports = router;