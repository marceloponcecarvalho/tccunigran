const assert = require('node:assert/strict');

const mockExecute = jest.fn();

jest.mock('../../src/config/databasePool', () => ({
    promise: jest.fn(() => ({
        execute: mockExecute
    }))
}));

const pool = require('../../src/config/databasePool');
const repository = require('../../src/repositories/relatoriosRepository');

beforeEach(() => {
    mockExecute.mockReset();
    pool.promise.mockClear();
});

// Períodos disponíveis
test('listarPeriodos deve retornar os períodos registrados', async () => {
    const periodos = [
        { ano: 2026, mes: 11 },
        { ano: 2026, mes: 10 }
    ];

    mockExecute.mockResolvedValueOnce([periodos]);

    const resultado = await repository.listarPeriodos();

    assert.deepEqual(resultado, periodos);
    assert.match(mockExecute.mock.calls[0][0], /SELECT DISTINCT/);
    assert.match(mockExecute.mock.calls[0][0], /YEAR\(data\)/);
    assert.match(mockExecute.mock.calls[0][0], /MONTH\(data\)/);
});

// Clientes disponíveis
test('listarClientes deve retornar os clientes ordenados pelo nome', async () => {
    const clientes = [{ idCliente: 1, nome: 'Cliente Teste' }];
    mockExecute.mockResolvedValueOnce([clientes]);

    const resultado = await repository.listarClientes();

    assert.deepEqual(resultado, clientes);
    assert.match(mockExecute.mock.calls[0][0], /FROM Cliente/);
    assert.match(mockExecute.mock.calls[0][0], /ORDER BY nome/);
});

// Manutenções do período
test('listarManutencoes deve consultar as manutenções dentro do período', async () => {
    const manutencoes = [{
        idManutencao: 1,
        data: '2026-11-15',
        ph: 7.4,
        alcalinidade: 80,
        cloro: 1,
        idCliente: 2,
        nomeCliente: 'Cliente Teste'
    }];

    mockExecute.mockResolvedValueOnce([manutencoes]);

    const resultado = await repository.listarManutencoes(
        '2026-11-01',
        '2026-12-01'
    );

    assert.deepEqual(resultado, manutencoes);
    assert.deepEqual(mockExecute.mock.calls[0][1], [
        '2026-11-01',
        '2026-12-01'
    ]);
    assert.match(mockExecute.mock.calls[0][0], /LEFT JOIN Cliente/);
    assert.match(mockExecute.mock.calls[0][0], /m\.data >= \?/);
    assert.match(mockExecute.mock.calls[0][0], /m\.data < \?/);
});

// Consumo de produtos
test('listarConsumo deve retornar quantidades e unidades correspondentes aos produtos', async () => {
    mockExecute.mockResolvedValueOnce([[
        { idProduto: 1, produto: 'Cloro', quantidadeUtilizada: 123 },
        { idProduto: 2, produto: 'Elevador de alcalinidade', quantidadeUtilizada: 200 },
        { idProduto: 3, produto: 'Elevador de pH', quantidadeUtilizada: 150 },
        { idProduto: 4, produto: 'Redutor de alcalinidade e pH', quantidadeUtilizada: 80 },
        { idProduto: 5, produto: 'Produto desconhecido', quantidadeUtilizada: 10 }
    ]]);

    const resultado = await repository.listarConsumo(
        '2026-11-01',
        '2026-12-01'
    );

    assert.deepEqual(resultado, [
        { idProduto: 1, produto: 'Cloro', quantidadeUtilizada: 123, unidade: 'g' },
        { idProduto: 2, produto: 'Elevador de alcalinidade', quantidadeUtilizada: 200, unidade: 'g' },
        { idProduto: 3, produto: 'Elevador de pH', quantidadeUtilizada: 150, unidade: 'ml' },
        { idProduto: 4, produto: 'Redutor de alcalinidade e pH', quantidadeUtilizada: 80, unidade: 'ml' },
        { idProduto: 5, produto: 'Produto desconhecido', quantidadeUtilizada: 10, unidade: '' }
    ]);

    assert.deepEqual(mockExecute.mock.calls[0][1], [
        '2026-11-01',
        '2026-12-01'
    ]);
    assert.match(mockExecute.mock.calls[0][0], /SUM\(im\.quantidadeUtilizada\)/);
    assert.match(mockExecute.mock.calls[0][0], /GROUP BY p\.idProduto, p\.tipo/);
});

// Histórico do cliente
test('listarHistoricoCliente deve retornar histórico com unidade do produto', async () => {
    mockExecute.mockResolvedValueOnce([[
        {
            idManutencao: 1,
            data: '2026-11-15',
            ph: 7.4,
            alcalinidade: 80,
            cloro: 1,
            produto: 'Cloro',
            quantidadeUtilizada: 123,
            idItem: 10
        },
        {
            idManutencao: 1,
            data: '2026-11-15',
            ph: 7.4,
            alcalinidade: 80,
            cloro: 1,
            produto: 'Elevador de pH',
            quantidadeUtilizada: 50,
            idItem: 11
        },
        {
            idManutencao: 2,
            data: '2026-10-10',
            ph: 7.2,
            alcalinidade: 90,
            cloro: 2,
            produto: null,
            quantidadeUtilizada: null,
            idItem: null
        }
    ]]);

    const resultado = await repository.listarHistoricoCliente(5);

    assert.equal(resultado.length, 3);
    assert.equal(resultado[0].unidade, 'g');
    assert.equal(resultado[1].unidade, 'ml');
    assert.equal(resultado[2].unidade, null);
    assert.deepEqual(mockExecute.mock.calls[0][1], [5]);
    assert.match(mockExecute.mock.calls[0][0], /LEFT JOIN ItemManutencao/);
    assert.match(mockExecute.mock.calls[0][0], /LEFT JOIN Produto/);
    assert.match(mockExecute.mock.calls[0][0], /WHERE m\.idCliente = \?/);
});

// Agenda
test('listarAgenda deve consultar os próximos 30 dias incluindo hoje', async () => {
    const agendamentos = [{
        idAgendamento: 1,
        data: '2026-11-15',
        horario: '08:00',
        idCliente: 2,
        nomeCliente: 'Cliente Teste'
    }];

    mockExecute.mockResolvedValueOnce([agendamentos]);

    const resultado = await repository.listarAgenda();

    assert.deepEqual(resultado, agendamentos);
    assert.match(mockExecute.mock.calls[0][0], /a\.data >= CURDATE\(\)/);
    assert.match(
        mockExecute.mock.calls[0][0],
        /DATE_ADD\(CURDATE\(\), INTERVAL 30 DAY\)/
    );
    assert.match(mockExecute.mock.calls[0][0], /ORDER BY a\.data, a\.horario/);
    assert.equal(mockExecute.mock.calls[0].length, 1);
});

// Erros do banco
test('listarPeriodos deve propagar erros do banco de dados', async () => {
    const erro = new Error('Erro simulado no banco de dados');
    mockExecute.mockRejectedValueOnce(erro);

    await assert.rejects(
        repository.listarPeriodos(),
        { message: 'Erro simulado no banco de dados' }
    );
});
