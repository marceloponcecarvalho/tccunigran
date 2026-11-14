
const express = require('express');
const request = require('supertest');

const mockAgendamentosController = {
    listar: jest.fn((req, res) => res.status(200).json({ rota: 'listar' })),
    buscarPorId: jest.fn((req, res) => res.status(200).json({ rota: 'buscarPorId' })),
    salvar: jest.fn((req, res) => res.status(200).json({ rota: 'salvar' })),
    excluir: jest.fn((req, res) => res.status(200).json({ rota: 'excluir' }))
};

jest.mock('../../src/controllers/agendamentosController', () => mockAgendamentosController);

const agendamentosRoutes = require('../../src/routes/agendamentosRoutes');

const app = express();
app.use(express.json());
app.use('/agendamentos', agendamentosRoutes);

beforeEach(() => {
    jest.clearAllMocks();
});

test('GET /listar deve encaminhar para listar', async () => {
    const resposta = await request(app).get('/agendamentos/');

    expect(resposta.status).toBe(200);
    expect(resposta.body.rota).toBe('listar');
    expect(mockAgendamentosController.listar).toHaveBeenCalledTimes(1);
});

test('GET /:id deve encaminhar para buscarPorId', async () => {
    const resposta = await request(app).get('/agendamentos/5');

    expect(resposta.status).toBe(200);
    expect(resposta.body.rota).toBe('buscarPorId');
    expect(mockAgendamentosController.buscarPorId).toHaveBeenCalledTimes(1);
    expect(mockAgendamentosController.buscarPorId.mock.calls[0][0].params.id).toBe('5');
});

test('POST /salvar deve encaminhar para salvar', async () => {
    const resposta = await request(app)
        .post('/agendamentos/')
        .send({ data: '2026-11-20' });

    expect(resposta.status).toBe(200);
    expect(resposta.body.rota).toBe('salvar');
    expect(mockAgendamentosController.salvar).toHaveBeenCalledTimes(1);
    expect(mockAgendamentosController.salvar.mock.calls[0][0].body.data).toBe('2026-11-20');
});

test('DELETE /:id deve encaminhar para excluir', async () => {
    const resposta = await request(app).delete('/agendamentos/5');

    expect(resposta.status).toBe(200);
    expect(resposta.body.rota).toBe('excluir');
    expect(mockAgendamentosController.excluir).toHaveBeenCalledTimes(1);
    expect(mockAgendamentosController.excluir.mock.calls[0][0].params.id).toBe('5');
});
