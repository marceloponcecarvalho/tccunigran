const assert = require('node:assert/strict');

const mockExecute = jest.fn();

jest.mock('../../src/config/database', () => ({
    promise: jest.fn(() => ({
        execute: mockExecute
    }))
}));

const database = require('../../src/config/database');
const agendamentosRepository = require('../../src/repositories/agendamentosRepository');

beforeEach(() => {
    mockExecute.mockReset();
    database.promise.mockClear();
});

// Listar agendamentos
test('listar deve retornar os agendamentos com os nomes dos clientes', async () => {
    const agendamentosEsperados = [
        {
            idAgendamento: 1,
            data: '2026-11-15',
            horario: '08:00',
            idCliente: 2,
            nomeCliente: 'Cliente Teste'
        }
    ];

    mockExecute.mockResolvedValueOnce([agendamentosEsperados]);

    const resultado = await agendamentosRepository.listar();

    assert.deepEqual(resultado, agendamentosEsperados);
    assert.match(mockExecute.mock.calls[0][0], /FROM Agendamento a/);
    assert.match(mockExecute.mock.calls[0][0], /JOIN Cliente/);
});

// Buscar agendamento pelo ID
test('buscarPorId deve retornar o agendamento encontrado', async () => {
    const agendamentoEsperado = {
        idAgendamento: 1,
        data: '2026-11-15',
        horario: '08:00',
        idCliente: 2,
        nomeCliente: 'Cliente Teste'
    };

    mockExecute.mockResolvedValueOnce([[agendamentoEsperado]]);

    const resultado = await agendamentosRepository.buscarPorId(1);

    assert.deepEqual(resultado, agendamentoEsperado);
    assert.deepEqual(mockExecute.mock.calls[0][1], [1]);
});

test('buscarPorId deve retornar null quando o agendamento não existir', async () => {
    mockExecute.mockResolvedValueOnce([[]]);

    const resultado = await agendamentosRepository.buscarPorId(999);

    assert.equal(resultado, null);
});

// Verificar conflito de data e horário
test('buscarConflito deve retornar o agendamento que ocupa o horário', async () => {
    const conflitoEsperado = {
        idAgendamento: 1,
        data: '2026-11-15',
        horario: '08:00',
        idCliente: 2,
        nomeCliente: 'Cliente Teste'
    };

    mockExecute.mockResolvedValueOnce([[conflitoEsperado]]);

    const resultado = await agendamentosRepository.buscarConflito(
        '2026-11-15',
        '08:00'
    );

    assert.deepEqual(resultado, conflitoEsperado);
    assert.deepEqual(mockExecute.mock.calls[0][1], [
        '2026-11-15',
        '08:00'
    ]);
});

test('buscarConflito deve retornar null quando o horário estiver disponível', async () => {
    mockExecute.mockResolvedValueOnce([[]]);

    const resultado = await agendamentosRepository.buscarConflito(
        '2026-11-15',
        '08:00'
    );

    assert.equal(resultado, null);
});

test('buscarConflito deve ignorar o próprio agendamento durante uma alteração', async () => {
    mockExecute.mockResolvedValueOnce([[]]);

    const resultado = await agendamentosRepository.buscarConflito(
        '2026-11-15',
        '08:00',
        5
    );

    assert.equal(resultado, null);
    assert.deepEqual(mockExecute.mock.calls[0][1], [
        '2026-11-15',
        '08:00',
        5
    ]);
    assert.match(mockExecute.mock.calls[0][0], /idAgendamento <> \?/);
});

// Salvar agendamento
test('salvar deve inserir um novo agendamento e retornar seu ID', async () => {
    mockExecute.mockResolvedValueOnce([
        {
            insertId: 10
        }
    ]);

    const resultado = await agendamentosRepository.salvar(
        null,
        '2026-11-15',
        '08:00',
        2
    );

    assert.equal(resultado, 10);
    assert.deepEqual(mockExecute.mock.calls[0][1], [
        '2026-11-15',
        '08:00',
        2
    ]);
    assert.match(mockExecute.mock.calls[0][0], /INSERT INTO Agendamento/);
});

test('salvar deve atualizar um agendamento existente', async () => {
    mockExecute
        .mockResolvedValueOnce([[{ idAgendamento: 5 }]])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const resultado = await agendamentosRepository.salvar(
        5,
        '2026-11-16',
        '11:00',
        3
    );

    assert.equal(resultado, 5);
    assert.equal(mockExecute.mock.calls.length, 2);
    assert.match(mockExecute.mock.calls[1][0], /UPDATE Agendamento/);
    assert.deepEqual(mockExecute.mock.calls[1][1], [
        '2026-11-16',
        '11:00',
        3,
        5
    ]);
});

test('salvar deve retornar erro ao tentar atualizar agendamento inexistente', async () => {
    mockExecute.mockResolvedValueOnce([[]]);

    await assert.rejects(
        agendamentosRepository.salvar(
            999,
            '2026-11-16',
            '11:00',
            3
        ),
        {
            message: 'Agendamento não encontrado.'
        }
    );

    assert.equal(mockExecute.mock.calls.length, 1);
});

// Excluir agendamento
test('excluir deve remover o agendamento existente', async () => {
    mockExecute.mockResolvedValueOnce([
        {
            affectedRows: 1
        }
    ]);

    const resultado = await agendamentosRepository.excluir(5);

    assert.equal(resultado, true);
    assert.deepEqual(mockExecute.mock.calls[0][1], [5]);
    assert.match(mockExecute.mock.calls[0][0], /DELETE FROM Agendamento/);
});

test('excluir deve retornar erro quando o agendamento não existir', async () => {
    mockExecute.mockResolvedValueOnce([
        {
            affectedRows: 0
        }
    ]);

    await assert.rejects(
        agendamentosRepository.excluir(999),
        {
            message: 'Agendamento não encontrado.'
        }
    );
});

// Erros do banco de dados
test('listar deve propagar erros ocorridos na consulta ao banco', async () => {
    const erroEsperado = new Error('Erro simulado no banco de dados');

    mockExecute.mockRejectedValueOnce(erroEsperado);

    await assert.rejects(
        agendamentosRepository.listar(),
        (erro) => {
            assert.equal(erro, erroEsperado);
            return true;
        }
    );
});
