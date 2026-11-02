const express = require('express');
const request = require('supertest');

// Simular o controller de clientes
jest.mock('../../src/controllers/clientesController', () => ({
    salvar: jest.fn((req, res) => res.status(200).json({ rota: 'salvar' })),
    buscar: jest.fn((req, res) => res.status(200).json({ rota: 'buscar' })),
    listar: jest.fn((req, res) => res.status(200).json({ rota: 'listar' }))
}));

const clientesController = require('../../src/controllers/clientesController');
const clientesRoutes = require('../../src/routes/clientesRoutes');

// Criar aplicação Express para os testes
const app = express();
app.use(express.json());
app.use('/clientes', clientesRoutes);

beforeEach(() => {
    jest.clearAllMocks();
});

// Testar rota POST /salvar
test('POST /clientes/salvar deve chamar o controller salvar', async () => {
    const resposta = await request(app)
        .post('/clientes/salvar')
        .send({ nome: 'Cliente Teste' });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ rota: 'salvar' });
    expect(clientesController.salvar).toHaveBeenCalledTimes(1);
});

// Testar rota GET /buscar
test('GET /clientes/buscar deve chamar o controller buscar', async () => {
    const resposta = await request(app)
        .get('/clientes/buscar')
        .query({ cpf: '12345678901' });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ rota: 'buscar' });
    expect(clientesController.buscar).toHaveBeenCalledTimes(1);
});

// Testar rota GET /listar
test('GET /clientes/listar deve chamar o controller listar', async () => {
    const resposta = await request(app)
        .get('/clientes/listar');

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ rota: 'listar' });
    expect(clientesController.listar).toHaveBeenCalledTimes(1);
});