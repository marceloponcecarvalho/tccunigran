const request = require('supertest');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const bcrypt = require('bcrypt');

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

// Simular controller de manutenção
jest.mock('../../src/controllers/manutencaoController', () => ({
    listarAgendamentosDisponiveis: jest.fn((req, res) => res.status(200).json([])),
    calcular: jest.fn((req, res) => res.status(200).json({
        body: req.body
    })),
    salvar: jest.fn((req, res) => res.status(201).json({
        body: req.body
    }))
}));

const clientesController = require('../../src/controllers/clientesController');
const produtosController = require('../../src/controllers/produtosController');
const manutencaoController = require('../../src/controllers/manutencaoController');

// Criar uma conta isolada para os testes de autenticação.
process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'segredo-exclusivo-dos-testes';

const diretorioTeste = fs.mkdtempSync(
    path.join(os.tmpdir(), 'tccunigran-unit-')
);

const diretorioSessoes = path.join(diretorioTeste, 'sessions');

fs.mkdirSync(diretorioSessoes, {
    recursive: true,
    mode: 0o700
});

process.env.AUTH_USER_FILE = path.join(diretorioTeste, 'usuario.json');
process.env.SESSION_FILE_STORE_PATH = diretorioSessoes;

fs.writeFileSync(
    process.env.AUTH_USER_FILE,
    JSON.stringify({
        usuario: 'usuario_teste',
        senhaHash: bcrypt.hashSync('SenhaTeste123', 4),
        versao: 1
    }),
    { mode: 0o600 }
);

const app = require('../../server');
const agente = request.agent(app);

beforeAll(async () => {
    const resposta = await agente
        .post('/auth/login')
        .send({
            usuario: 'usuario_teste',
            senha: 'SenhaTeste123'
        });

    expect(resposta.status).toBe(200);
});

afterAll(() => {
    fs.rmSync(diretorioTeste, {
        recursive: true,
        force: true
    });
});

// Limpar chamadas anteriores
beforeEach(() => {
    jest.clearAllMocks();
});

// Testar rota inexistente
test('deve retornar HTTP 404 para uma rota inexistente', async () => {
    const resposta = await agente
        .get('/rota-inexistente');

    expect(resposta.status).toBe(404);
    expect(resposta.text).toBe('Pagina invalida');
});

// Testar rota de listagem de clientes
test('deve encaminhar requisição para a rota de clientes', async () => {
    const resposta = await agente
        .get('/clientes/listar');

    expect(resposta.status).toBe(200);
    expect(clientesController.listar).toHaveBeenCalledTimes(1);
});

// Testar rota de listagem de produtos
test('deve encaminhar requisição para a rota de produtos', async () => {
    const resposta = await agente
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

    const resposta = await agente
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

    const resposta = await agente
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

    const resposta = await agente
        .get('/index.html');

    expect(resposta.status).toBe(200);
    expect(resposta.text).toContain('<html');
});

// Testar listagem de agendamentos disponíveis para manutenção
test('deve encaminhar requisição para listar agendamentos disponíveis', async () => {
    const resposta = await agente
        .get('/manutencoes/agendamentos');

    expect(resposta.status).toBe(200);
    expect(manutencaoController.listarAgendamentosDisponiveis).toHaveBeenCalledTimes(1);
});

// Testar cálculo de manutenção
test('deve encaminhar medições para calcular a manutenção', async () => {
    const dados = {
        idAgendamento: 1,
        medicoes: {
            ph: 7.0,
            alcalinidade: 80,
            cloro: 1
        }
    };

    const resposta = await agente
        .post('/manutencoes/calcular')
        .send(dados);

    expect(resposta.status).toBe(200);
    expect(resposta.body.body).toEqual(dados);
    expect(manutencaoController.calcular).toHaveBeenCalledTimes(1);
});

// Testar confirmação de manutenção
test('deve encaminhar dados para registrar a manutenção', async () => {
    const dados = {
        idAgendamento: 1,
        medicoes: {
            ph: 7.0,
            alcalinidade: 80,
            cloro: 1
        }
    };

    const resposta = await agente
        .post('/manutencoes/salvar')
        .send(dados);

    expect(resposta.status).toBe(201);
    expect(resposta.body.body).toEqual(dados);
    expect(manutencaoController.salvar).toHaveBeenCalledTimes(1);
});


// Verificar proteção das APIs e dos arquivos internos.
test('deve rejeitar acesso não autenticado às APIs', async () => {
    const resposta = await request(app)
        .get('/clientes/listar');

    expect(resposta.status).toBe(401);
});

test('não deve disponibilizar scripts internos sem autenticação', async () => {
    const resposta = await request(app)
        .get('/js/clientes.js');

    expect(resposta.status).toBe(302);
    expect(resposta.headers.location).toBe('/login.html');
});

test('deve disponibilizar o script público de login sem autenticação', async () => {
    const resposta = await request(app)
        .get('/js/login.js');

    expect(resposta.status).toBe(200);
});
