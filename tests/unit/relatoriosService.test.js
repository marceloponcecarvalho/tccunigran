const assert = require('node:assert/strict');

jest.mock('../../src/repositories/relatoriosRepository', () => ({
    listarPeriodos: jest.fn(),
    listarClientes: jest.fn(),
    listarManutencoes: jest.fn(),
    listarConsumo: jest.fn(),
    listarHistoricoCliente: jest.fn(),
    listarAgenda: jest.fn()
}));

const repository = require('../../src/repositories/relatoriosRepository');
const service = require('../../src/services/relatoriosService');

beforeEach(() => {
    jest.clearAllMocks();
});

// Listar períodos e clientes
test('listarPeriodos deve retornar os períodos disponíveis', async () => {
    const periodos = [{ ano: 2026, mes: 11 }];
    repository.listarPeriodos.mockResolvedValueOnce(periodos);

    assert.deepEqual(await service.listarPeriodos(), periodos);
    expect(repository.listarPeriodos).toHaveBeenCalledTimes(1);
});

test('listarClientes deve retornar os clientes disponíveis', async () => {
    const clientes = [{ idCliente: 1, nome: 'Cliente Teste' }];
    repository.listarClientes.mockResolvedValueOnce(clientes);

    assert.deepEqual(await service.listarClientes(), clientes);
    expect(repository.listarClientes).toHaveBeenCalledTimes(1);
});

// Validar período
test.each([
    [1, 2026, '2026-01-01', '2026-02-01'],
    [9, 2026, '2026-09-01', '2026-10-01'],
    [11, 2026, '2026-11-01', '2026-12-01'],
    [12, 2026, '2026-12-01', '2027-01-01'],
    ['02', '2024', '2024-02-01', '2024-03-01']
])(
    'listarManutencoes deve calcular corretamente o período %s/%s',
    async (mes, ano, dataInicial, dataFinal) => {
        repository.listarManutencoes.mockResolvedValueOnce([]);

        await service.listarManutencoes(mes, ano);

        expect(repository.listarManutencoes).toHaveBeenCalledWith(
            dataInicial,
            dataFinal
        );
    }
);

test.each([
    [0, 2026],
    [13, 2026],
    [-1, 2026],
    ['abc', 2026],
    [1.5, 2026],
    ['', 2026],
    [1, 1999],
    [1, 2101],
    [1, 'abc'],
    [1, 2026.5],
    [1, '']
])(
    'listarManutencoes deve rejeitar período inválido (%s/%s)',
    async (mes, ano) => {
        await assert.rejects(
            service.listarManutencoes(mes, ano),
            {
                message: 'Mês ou ano inválido.',
                statusCode: 400
            }
        );

        expect(repository.listarManutencoes).not.toHaveBeenCalled();
    }
);

test('listarConsumo deve validar o período e encaminhar as datas ao repository', async () => {
    repository.listarConsumo.mockResolvedValueOnce([]);

    await service.listarConsumo(12, 2026);

    expect(repository.listarConsumo).toHaveBeenCalledWith(
        '2026-12-01',
        '2027-01-01'
    );
});

test('listarConsumo deve rejeitar período inválido', async () => {
    await assert.rejects(
        service.listarConsumo(15, 2026),
        {
            message: 'Mês ou ano inválido.',
            statusCode: 400
        }
    );

    expect(repository.listarConsumo).not.toHaveBeenCalled();
});

// Validar identificador do cliente
test.each([1, 25, '3', '100'])(
    'listarHistoricoCliente deve aceitar o ID %s',
    async (idCliente) => {
        repository.listarHistoricoCliente.mockResolvedValueOnce([]);

        await service.listarHistoricoCliente(idCliente);

        expect(repository.listarHistoricoCliente).toHaveBeenCalledWith(
            Number(idCliente)
        );
    }
);

test.each([0, -1, 'abc', '', 1.5, null, undefined])(
    'listarHistoricoCliente deve rejeitar ID inválido (%s)',
    async (idCliente) => {
        await assert.rejects(
            service.listarHistoricoCliente(idCliente),
            {
                message: 'ID do cliente inválido.',
                statusCode: 400
            }
        );

        expect(repository.listarHistoricoCliente).not.toHaveBeenCalled();
    }
);

// Listar agenda
test('listarAgenda deve retornar os agendamentos do repository', async () => {
    const agenda = [{ idAgendamento: 1 }];
    repository.listarAgenda.mockResolvedValueOnce(agenda);

    assert.deepEqual(await service.listarAgenda(), agenda);
    expect(repository.listarAgenda).toHaveBeenCalledTimes(1);
});
