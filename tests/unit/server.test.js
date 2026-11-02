const request = require('supertest');
const fs = require('node:fs');
const path = require('node:path');

// Simular dotenv
jest.mock('dotenv', () => ({
    config: jest.fn()
}));

// Simular conexão com o banco de dados
jest.mock('../../src/config/database', () => ({
    query: jest.fn(),
    promise: jest.fn()
}));

// Simular controller de clientes
jest.mock('../../src/controllers/clientesController', () => ({
    salvar: jest.fn((req, res) => res.status(200).json({
        body: req.body,
        query: req.query
    })),
    buscar: jest.fn((req, res) => res.status(200).json({
        body: req.body,
        query: req.query
    })),
    listar: jest.fn((req, res) => res.status(200).json({
        body: req.body,
        query: req.query
    }))
}));

// Simular controller de produtos
jest.mock('../../src/controllers/produtosController', () => ({
    listar: jest.fn((req, res) => res.status(200).json({
        body: req.body,
        query: req.query
    })),
    buscar: jest.fn((req, res) => res.status(200).json({
        body: req.body,
        query: req.query
    })),
    atualizar: jest.fn((req, res) => res.status(200).json({
        body: req.body,
        query: req.query
    }))
}));

const clientesController = require('../../src/controllers/clientesController');
const produtosController = require('../../src/controllers/produtosController');

const app = require('../../server');

// Limpar chamadas anteriores
beforeEach(() => {
    jest.clearAllMocks();
});

// Testar rota inexistente
test('deve retornar HTTP 404 para uma rota inexistente', async () => {
    const resposta = await request(app)
        .get('/rota-inexistente');

    expect(resposta.status).toBe(404);
    expect(resposta.text).toBe('Pagina invalida');
});

// Testar rota de listagem de clientes
test('deve encaminhar requisição para a rota de clientes', async () => {
    const resposta = await request(app)
        .get('/clientes/listar');

    expect(resposta.status).toBe(200);
    expect(clientesController.listar).toHaveBeenCalledTimes(1);
});

// Testar rota de listagem de produtos
test('deve encaminhar requisição para a rota de produtos', async () => {
    const resposta = await request(app)
        .get('/produtos/listar');

    expect(resposta.status).toBe(200);
    expect(produtosController.listar).toHaveBeenCalledTimes(1);
});

// Testar interpretação de JSON
test('deve interpretar requisições no formato JSON', async () => {
    const dados = {
        idProduto: 1,
        quantidade: 1000
    };

    const resposta = await request(app)
        .put('/produtos/atualizar')
        .send(dados);

    expect(resposta.status).toBe(200);
    expect(resposta.body.body).toEqual(dados);
    expect(produtosController.atualizar).toHaveBeenCalledTimes(1);
});

// Testar interpretação de formulários URL-encoded
test('deve interpretar requisições no formato URL-encoded', async () => {
    const dados = {
        nome: 'Cliente Teste',
        cpf: '12345678901'
    };

    const resposta = await request(app)
        .post('/clientes/salvar')
        .type('form')
        .send(dados);

    expect(resposta.status).toBe(200);
    expect(resposta.body.body).toEqual(dados);
    expect(clientesController.salvar).toHaveBeenCalledTimes(1);
});

// Testar disponibilização de arquivos estáticos
test('deve disponibilizar arquivos da pasta public', async () => {
    const arquivo = path.join(__dirname, '../../public/index.html');

    expect(fs.existsSync(arquivo)).toBe(true);

    const resposta = await request(app)
        .get('/index.html');

    expect(resposta.status).toBe(200);
    expect(resposta.text).toContain('<html');
});