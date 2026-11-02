const express = require('express');
const request = require('supertest');

// Simular o controller de produtos
jest.mock('../../src/controllers/produtosController', () => ({
    listar: jest.fn((req, res) => res.status(200).json({ rota: 'listar' })),
    buscar: jest.fn((req, res) => res.status(200).json({ rota: 'buscar' })),
    atualizar: jest.fn((req, res) => res.status(200).json({ rota: 'atualizar' }))
}));

const produtosController = require('../../src/controllers/produtosController');
const produtosRoutes = require('../../src/routes/produtosRoutes');

// Criar aplicação Express para os testes
const app = express();
app.use(express.json());
app.use('/produtos', produtosRoutes);

beforeEach(() => {
    jest.clearAllMocks();
});

// Testar rota GET /listar
test('GET /produtos/listar deve chamar o controller listar', async () => {
    const resposta = await request(app)
        .get('/produtos/listar');

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ rota: 'listar' });
    expect(produtosController.listar).toHaveBeenCalledTimes(1);
});

// Testar rota GET /buscar
test('GET /produtos/buscar deve chamar o controller buscar', async () => {
    const resposta = await request(app)
        .get('/produtos/buscar')
        .query({ tipo: 'Cloro' });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ rota: 'buscar' });
    expect(produtosController.buscar).toHaveBeenCalledTimes(1);
});

// Testar rota PUT /atualizar
test('PUT /produtos/atualizar deve chamar o controller atualizar', async () => {
    const resposta = await request(app)
        .put('/produtos/atualizar')
        .send({ idProduto: 1, quantidade: 1000 });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ rota: 'atualizar' });
    expect(produtosController.atualizar).toHaveBeenCalledTimes(1);
});