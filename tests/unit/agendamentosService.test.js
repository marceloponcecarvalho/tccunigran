const assert = require('node:assert/strict');

jest.mock('../../src/repositories/agendamentosRepository', () => ({
    listar: jest.fn(),
    buscarPorId: jest.fn(),
    buscarConflito: jest.fn(),
    salvar: jest.fn(),
    excluir: jest.fn()
}));

jest.mock('../../src/services/clientesService', () => ({
    listar: jest.fn()
}));

const agendamentosRepository = require('../../src/repositories/agendamentosRepository');
const clientesService = require('../../src/services/clientesService');
const agendamentosService = require('../../src/services/agendamentosService');

const cliente = {
    idCliente: 2,
    nome: 'Cliente Teste'
};

const agendamento = {
    idAgendamento: 1,
    data: '2026-11-15',
    horario: '08:00',
    idCliente: 2,
    nomeCliente: 'Cliente Teste'
};

beforeEach(() => {
    jest.clearAllMocks();
});

// Listar agendamentos
test('listar deve retornar os agendamentos do repository', async () => {
    agendamentosRepository.listar.mockResolvedValueOnce([agendamento]);

    const resultado = await agendamentosService.listar();

    assert.deepEqual(resultado, [agendamento]);
    assert.equal(agendamentosRepository.listar.mock.calls.length, 1);
});

// Buscar agendamento pelo ID
test('buscarPorId deve retornar o agendamento encontrado', async () => {
    agendamentosRepository.buscarPorId.mockResolvedValueOnce(agendamento);

    const resultado = await agendamentosService.buscarPorId(1);

    assert.deepEqual(resultado, agendamento);
    assert.equal(agendamentosRepository.buscarPorId.mock.calls[0][0], 1);
});

test('buscarPorId deve rejeitar ID inválido', async () => {
    await assert.rejects(
        agendamentosService.buscarPorId(0),
        { message: 'ID do agendamento inválido.' }
    );

    assert.equal(agendamentosRepository.buscarPorId.mock.calls.length, 0);
});

test('buscarPorId deve informar quando o agendamento não existir', async () => {
    agendamentosRepository.buscarPorId.mockResolvedValueOnce(null);

    await assert.rejects(
        agendamentosService.buscarPorId(999),
        { message: 'Agendamento não encontrado.' }
    );
});

// Validar horários permitidos
test.each([
    '05:00',
    '08:00',
    '11:00',
    '14:00',
    '17:00'
])('salvar deve aceitar o horário %s', async (horario) => {
    clientesService.listar.mockResolvedValueOnce([cliente]);
    agendamentosRepository.buscarConflito.mockResolvedValueOnce(null);
    agendamentosRepository.salvar.mockResolvedValueOnce(10);

    const resultado = await agendamentosService.salvar(
        null,
        '2026-11-15',
        horario,
        2
    );

    assert.equal(resultado, 10);
});

test('salvar deve rejeitar horário não permitido', async () => {
    await assert.rejects(
        agendamentosService.salvar(null, '2026-11-15', '19:00', 2),
        { message: 'Horário inválido. Selecione um dos horários disponíveis.' }
    );

    assert.equal(clientesService.listar.mock.calls.length, 0);
    assert.equal(agendamentosRepository.salvar.mock.calls.length, 0);
});

// Validar data
test.each([
    '15/11/2026',
    '2026-02-30',
    '2026-13-01',
    'data-invalida'
])('salvar deve rejeitar a data inválida %s', async (data) => {
    await assert.rejects(
        agendamentosService.salvar(null, data, '08:00', 2),
        { message: 'Data inválida.' }
    );

    assert.equal(agendamentosRepository.salvar.mock.calls.length, 0);
});

test('salvar deve rejeitar uma data anterior à data atual', async () => {
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);

    const dataAnterior = [
        ontem.getFullYear(),
        String(ontem.getMonth() + 1).padStart(2, '0'),
        String(ontem.getDate()).padStart(2, '0')
    ].join('-');

    await assert.rejects(
        agendamentosService.salvar(null, dataAnterior, '08:00', 2),
        { message: 'Não é permitido agendar em uma data anterior à atual.' }
    );

    assert.equal(clientesService.listar.mock.calls.length, 0);
    assert.equal(agendamentosRepository.salvar.mock.calls.length, 0);
});

test('salvar deve aceitar a data atual', async () => {
    const hoje = new Date();

    const dataAtual = [
        hoje.getFullYear(),
        String(hoje.getMonth() + 1).padStart(2, '0'),
        String(hoje.getDate()).padStart(2, '0')
    ].join('-');

    clientesService.listar.mockResolvedValueOnce([cliente]);
    agendamentosRepository.buscarConflito.mockResolvedValueOnce(null);
    agendamentosRepository.salvar.mockResolvedValueOnce(10);

    const resultado = await agendamentosService.salvar(
        null,
        dataAtual,
        '05:00',
        2
    );

    assert.equal(resultado, 10);
});

// Validar cliente
test('salvar deve rejeitar ID de cliente inválido', async () => {
    await assert.rejects(
        agendamentosService.salvar(null, '2026-11-15', '08:00', 0),
        { message: 'Cliente inválido.' }
    );

    assert.equal(clientesService.listar.mock.calls.length, 0);
});

test('salvar deve rejeitar cliente não cadastrado', async () => {
    clientesService.listar.mockResolvedValueOnce([cliente]);

    await assert.rejects(
        agendamentosService.salvar(null, '2026-11-15', '08:00', 999),
        { message: 'Cliente não encontrado.' }
    );

    assert.equal(agendamentosRepository.buscarConflito.mock.calls.length, 0);
    assert.equal(agendamentosRepository.salvar.mock.calls.length, 0);
});

// Verificar disponibilidade
test('salvar deve cadastrar agendamento quando o horário estiver disponível', async () => {
    clientesService.listar.mockResolvedValueOnce([cliente]);
    agendamentosRepository.buscarConflito.mockResolvedValueOnce(null);
    agendamentosRepository.salvar.mockResolvedValueOnce(10);

    const resultado = await agendamentosService.salvar(
        null,
        '2026-11-15',
        '08:00',
        2
    );

    assert.equal(resultado, 10);

    const argumentosConflito =
        agendamentosRepository.buscarConflito.mock.calls[0];

    assert.equal(argumentosConflito[0], '2026-11-15');
    assert.equal(argumentosConflito[1], '08:00');
    assert.equal(argumentosConflito[2], null);

    const argumentosSalvar =
        agendamentosRepository.salvar.mock.calls[0];

    assert.equal(argumentosSalvar[0], null);
    assert.equal(argumentosSalvar[1], '2026-11-15');
    assert.equal(argumentosSalvar[2], '08:00');
    assert.equal(argumentosSalvar[3], 2);
});

test('salvar deve informar o nome do cliente quando o horário estiver ocupado', async () => {
    clientesService.listar.mockResolvedValueOnce([cliente]);

    agendamentosRepository.buscarConflito.mockResolvedValueOnce({
        ...agendamento,
        nomeCliente: 'Outro Cliente'
    });

    await assert.rejects(
        agendamentosService.salvar(null, '2026-11-15', '08:00', 2),
        { message: 'Horário já ocupado pelo cliente Outro Cliente.' }
    );

    assert.equal(agendamentosRepository.salvar.mock.calls.length, 0);
});

// Atualizar agendamento
test('salvar deve ignorar o próprio agendamento ao verificar conflito', async () => {
    clientesService.listar.mockResolvedValueOnce([cliente]);
    agendamentosRepository.buscarConflito.mockResolvedValueOnce(null);
    agendamentosRepository.salvar.mockResolvedValueOnce(5);

    const resultado = await agendamentosService.salvar(
        5,
        '2026-11-16',
        '11:00',
        2
    );

    assert.equal(resultado, 5);

    const argumentosConflito =
        agendamentosRepository.buscarConflito.mock.calls[0];

    assert.equal(argumentosConflito[0], '2026-11-16');
    assert.equal(argumentosConflito[1], '11:00');
    assert.equal(argumentosConflito[2], 5);

    const argumentosSalvar =
        agendamentosRepository.salvar.mock.calls[0];

    assert.equal(argumentosSalvar[0], 5);
    assert.equal(argumentosSalvar[1], '2026-11-16');
    assert.equal(argumentosSalvar[2], '11:00');
    assert.equal(argumentosSalvar[3], 2);
});

// Excluir agendamento
test('excluir deve encaminhar a exclusão ao repository', async () => {
    agendamentosRepository.excluir.mockResolvedValueOnce(true);

    const resultado = await agendamentosService.excluir(5);

    assert.equal(resultado, true);
    assert.equal(agendamentosRepository.excluir.mock.calls[0][0], 5);
});

test('excluir deve rejeitar ID inválido', async () => {
    await assert.rejects(
        agendamentosService.excluir(0),
        { message: 'ID do agendamento inválido.' }
    );

    assert.equal(agendamentosRepository.excluir.mock.calls.length, 0);
});
