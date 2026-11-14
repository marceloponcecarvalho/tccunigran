const assert = require('node:assert/strict');

jest.mock('../../src/services/manutencaoService', () => ({
    listarAgendamentosDisponiveis: jest.fn(),
    calcular: jest.fn(),
    salvar: jest.fn()
}));

const manutencaoService = require('../../src/services/manutencaoService');
const manutencaoController = require('../../src/controllers/manutencaoController');

const agendamentos = [
    {
        idAgendamento: 1,
        data: '2026-11-13',
        horario: '08:00',
        idCliente: 2,
        nomeCliente: 'Cliente Teste'
    }
];

const dados = {
    idAgendamento: 1,
    medicoes: {
        ph: 7.0,
        alcalinidade: 80,
        cloro: 1
    }
};

function criarMocksExpress(dadosRequisicao = {}) {
    const req = dadosRequisicao;

    const res = {
        statusCode: 200,
        body: null,

        status(codigo) {
            this.statusCode = codigo;
            return this;
        },

        json(conteudo) {
            this.body = conteudo;
            return this;
        }
    };

    return { req, res };
}

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    jest.restoreAllMocks();
});

// Listar agendamentos disponíveis
test('listarAgendamentosDisponiveis deve retornar os agendamentos', async () => {
    manutencaoService.listarAgendamentosDisponiveis
        .mockResolvedValue(agendamentos);

    const { req, res } = criarMocksExpress();

    await manutencaoController.listarAgendamentosDisponiveis(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, agendamentos);

    expect(manutencaoService.listarAgendamentosDisponiveis)
        .toHaveBeenCalledTimes(1);
});

test('listarAgendamentosDisponiveis deve retornar erro 500 quando ocorrer falha', async () => {
    manutencaoService.listarAgendamentosDisponiveis
        .mockRejectedValue(new Error('Erro no banco'));

    const { req, res } = criarMocksExpress();

    await manutencaoController.listarAgendamentosDisponiveis(req, res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, {
        erro: 'Erro ao consultar os agendamentos disponíveis.'
    });
});

// Calcular dosagens
test('calcular deve retornar o resultado do serviço', async () => {
    const resultado = {
        ...dados,
        produtos: [],
        orientacoes: []
    };

    manutencaoService.calcular.mockResolvedValue(resultado);

    const { req, res } = criarMocksExpress({
        body: dados
    });

    await manutencaoController.calcular(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, resultado);

    expect(manutencaoService.calcular)
        .toHaveBeenCalledWith(dados.idAgendamento, dados.medicoes);
});

test('calcular deve retornar erro 400 para medições inválidas', async () => {
    const erro = new Error('Medição inválida.');
    erro.statusCode = 400;

    manutencaoService.calcular.mockRejectedValue(erro);

    const { req, res } = criarMocksExpress({
        body: dados
    });

    await manutencaoController.calcular(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
        erro: 'Medição inválida.'
    });
});

test('calcular deve retornar erro 404 quando o agendamento não existir', async () => {
    const erro = new Error('Agendamento não encontrado.');
    erro.statusCode = 404;

    manutencaoService.calcular.mockRejectedValue(erro);

    const { req, res } = criarMocksExpress({
        body: dados
    });

    await manutencaoController.calcular(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, {
        erro: 'Agendamento não encontrado.'
    });
});

test('calcular deve retornar erro 500 para falha inesperada', async () => {
    manutencaoService.calcular.mockRejectedValue(
        new Error('Erro no banco')
    );

    const { req, res } = criarMocksExpress({
        body: dados
    });

    await manutencaoController.calcular(req, res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, {
        erro: 'Erro ao calcular a manutenção.'
    });
});

// Registrar manutenção
test('salvar deve registrar a manutenção com sucesso', async () => {
    const resultado = {
        idManutencao: 10,
        idAgendamento: 1,
        data: '2026-11-13',
        idCliente: 2
    };

    manutencaoService.salvar.mockResolvedValue(resultado);

    const { req, res } = criarMocksExpress({
        body: dados
    });

    await manutencaoController.salvar(req, res);

    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body, {
        mensagem: 'Manutenção registrada com sucesso.',
        ...resultado
    });

    expect(manutencaoService.salvar)
        .toHaveBeenCalledWith(dados.idAgendamento, dados.medicoes);
});

test('salvar deve retornar erro 409 quando o estoque for insuficiente', async () => {
    const erro = new Error('Estoque insuficiente.');
    erro.statusCode = 409;
    erro.detalhes = [
        {
            tipo: 'Cloro',
            unidade: 'g',
            necessario: 192,
            disponivel: 100,
            faltante: 92
        }
    ];

    manutencaoService.salvar.mockRejectedValue(erro);

    const { req, res } = criarMocksExpress({
        body: dados
    });

    await manutencaoController.salvar(req, res);

    assert.equal(res.statusCode, 409);
    assert.deepEqual(res.body, {
        erro: 'Estoque insuficiente.',
        detalhes: erro.detalhes
    });
});

test('salvar deve retornar erro 400 para dados inválidos', async () => {
    const erro = new Error('Medição inválida.');
    erro.statusCode = 400;

    manutencaoService.salvar.mockRejectedValue(erro);

    const { req, res } = criarMocksExpress({
        body: dados
    });

    await manutencaoController.salvar(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
        erro: 'Medição inválida.'
    });
});

test('salvar deve retornar erro 404 quando o agendamento não existir', async () => {
    const erro = new Error('Agendamento não encontrado.');
    erro.statusCode = 404;

    manutencaoService.salvar.mockRejectedValue(erro);

    const { req, res } = criarMocksExpress({
        body: dados
    });

    await manutencaoController.salvar(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, {
        erro: 'Agendamento não encontrado.'
    });
});

test('salvar deve retornar erro 500 para falha inesperada', async () => {
    manutencaoService.salvar.mockRejectedValue(
        new Error('Erro no banco')
    );

    const { req, res } = criarMocksExpress({
        body: dados
    });

    await manutencaoController.salvar(req, res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, {
        erro: 'Erro ao registrar a manutenção.'
    });
});
