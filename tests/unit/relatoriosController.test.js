const assert = require('node:assert/strict');

jest.mock('../../src/services/relatoriosService', () => ({
    listarPeriodos: jest.fn(),
    listarClientes: jest.fn(),
    listarManutencoes: jest.fn(),
    listarConsumo: jest.fn(),
    listarHistoricoCliente: jest.fn(),
    listarAgenda: jest.fn()
}));

const service = require('../../src/services/relatoriosService');
const controller = require('../../src/controllers/relatoriosController');

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    jest.restoreAllMocks();
});

function criarMocksExpress(dados = {}) {
    const req = dados;

    const res = {
        statusCode: 200,
        body: null,

        status(codigo) {
            this.statusCode = codigo;
            return this;
        },

        json(dados) {
            this.body = dados;
            return this;
        }
    };

    return { req, res };
}

// Períodos
test('listarPeriodos deve retornar os períodos disponíveis', async () => {
    const resultado = [{ ano: 2026, mes: 11 }];
    service.listarPeriodos.mockResolvedValue(resultado);

    const { req, res } = criarMocksExpress();
    await controller.listarPeriodos(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, resultado);
    expect(service.listarPeriodos).toHaveBeenCalledTimes(1);
});

// Clientes
test('listarClientes deve retornar os clientes disponíveis', async () => {
    const resultado = [{ idCliente: 1, nome: 'Cliente Teste' }];
    service.listarClientes.mockResolvedValue(resultado);

    const { req, res } = criarMocksExpress();
    await controller.listarClientes(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, resultado);
    expect(service.listarClientes).toHaveBeenCalledTimes(1);
});

// Manutenções
test('listarManutencoes deve encaminhar mês e ano ao service', async () => {
    const resultado = [{ idManutencao: 1 }];
    service.listarManutencoes.mockResolvedValue(resultado);

    const { req, res } = criarMocksExpress({
        query: { mes: '11', ano: '2026' }
    });

    await controller.listarManutencoes(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, resultado);
    expect(service.listarManutencoes).toHaveBeenCalledWith('11', '2026');
});

test('listarManutencoes deve retornar erro de validação', async () => {
    const erro = new Error('Mês ou ano inválido.');
    erro.statusCode = 400;
    service.listarManutencoes.mockRejectedValue(erro);

    const { req, res } = criarMocksExpress({
        query: { mes: '13', ano: '2026' }
    });

    await controller.listarManutencoes(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { erro: 'Mês ou ano inválido.' });
});

// Consumo
test('listarConsumo deve encaminhar mês e ano ao service', async () => {
    const resultado = [{ produto: 'Cloro', quantidadeUtilizada: 123, unidade: 'g' }];
    service.listarConsumo.mockResolvedValue(resultado);

    const { req, res } = criarMocksExpress({
        query: { mes: '11', ano: '2026' }
    });

    await controller.listarConsumo(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, resultado);
    expect(service.listarConsumo).toHaveBeenCalledWith('11', '2026');
});

test('listarConsumo deve retornar erro de validação', async () => {
    const erro = new Error('Mês ou ano inválido.');
    erro.statusCode = 400;
    service.listarConsumo.mockRejectedValue(erro);

    const { req, res } = criarMocksExpress({
        query: { mes: '0', ano: '2026' }
    });

    await controller.listarConsumo(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { erro: 'Mês ou ano inválido.' });
});

// Histórico do cliente
test('listarHistoricoCliente deve encaminhar o ID ao service', async () => {
    const resultado = [{ idManutencao: 1, produto: 'Cloro' }];
    service.listarHistoricoCliente.mockResolvedValue(resultado);

    const { req, res } = criarMocksExpress({
        params: { idCliente: '5' }
    });

    await controller.listarHistoricoCliente(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, resultado);
    expect(service.listarHistoricoCliente).toHaveBeenCalledWith('5');
});

test('listarHistoricoCliente deve retornar erro para ID inválido', async () => {
    const erro = new Error('ID do cliente inválido.');
    erro.statusCode = 400;
    service.listarHistoricoCliente.mockRejectedValue(erro);

    const { req, res } = criarMocksExpress({
        params: { idCliente: 'abc' }
    });

    await controller.listarHistoricoCliente(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { erro: 'ID do cliente inválido.' });
});

// Agenda
test('listarAgenda deve retornar os agendamentos', async () => {
    const resultado = [{ idAgendamento: 1, horario: '08:00' }];
    service.listarAgenda.mockResolvedValue(resultado);

    const { req, res } = criarMocksExpress();
    await controller.listarAgenda(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, resultado);
    expect(service.listarAgenda).toHaveBeenCalledTimes(1);
});

// Erros internos
test.each([
    ['listarPeriodos', 'Erro ao consultar os períodos disponíveis.'],
    ['listarClientes', 'Erro ao consultar os clientes para os relatórios.'],
    ['listarManutencoes', 'Erro ao consultar as manutenções do período.'],
    ['listarConsumo', 'Erro ao consultar o consumo de produtos do período.'],
    ['listarHistoricoCliente', 'Erro ao consultar o histórico do cliente.'],
    ['listarAgenda', 'Erro ao consultar a agenda dos próximos 30 dias.']
])(
    '%s deve retornar erro 500 quando o service falhar',
    async (metodo, mensagem) => {
        service[metodo].mockRejectedValue(
            new Error('Erro simulado no banco de dados')
        );

        const { req, res } = criarMocksExpress({
            query: { mes: '11', ano: '2026' },
            params: { idCliente: '1' }
        });

        await controller[metodo](req, res);

        assert.equal(res.statusCode, 500);
        assert.deepEqual(res.body, { erro: mensagem });
        expect(console.error).toHaveBeenCalledTimes(1);
    }
);
