
const assert = require('node:assert/strict');

// Simular conexão com o banco de dados
jest.mock('../../src/config/database', () => ({
    query: jest.fn(),
    promise: jest.fn()
}));

const con = require('../../src/config/database');
const clientesRepository = require('../../src/repositories/clientesRepository');

let db;

beforeEach(() => {
    jest.clearAllMocks();

    db = {
        beginTransaction: jest.fn().mockResolvedValue(),
        execute: jest.fn(),
        commit: jest.fn().mockResolvedValue(),
        rollback: jest.fn().mockResolvedValue()
    };

    con.promise.mockReturnValue(db);
});

// Testar cadastro de cliente e inclusão de piscina
test('salvar deve cadastrar cliente novo e incluir piscina', async () => {
    db.execute
        .mockResolvedValueOnce([{ insertId: 1 }])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([{}]);

    const id = await clientesRepository.salvar(
        null,
        'Cliente Teste',
        '12345678901',
        'Rua Teste',
        '67999999999',
        'teste@email.com',
        1.5,
        4,
        5
    );

    assert.equal(id, 1);

    expect(db.beginTransaction).toHaveBeenCalledTimes(1);
    expect(db.execute).toHaveBeenCalledTimes(3);
    expect(db.commit).toHaveBeenCalledTimes(1);
    expect(db.rollback).not.toHaveBeenCalled();

    expect(db.execute.mock.calls[0][1]).toEqual([
        'Cliente Teste',
        '12345678901',
        'Rua Teste',
        '67999999999',
        'teste@email.com'
    ]);

    expect(db.execute.mock.calls[1][1]).toEqual([1]);

    expect(db.execute.mock.calls[2][1]).toEqual([
        1.5,
        4,
        5,
        1
    ]);
});

// Testar atualização de cliente e piscina existente
test('salvar deve atualizar cliente e piscina existente', async () => {
    db.execute
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([[{ idPiscina: 1 }]])
        .mockResolvedValueOnce([{}]);

    const id = await clientesRepository.salvar(
        1,
        'Cliente Atualizado',
        '12345678901',
        'Rua Atualizada',
        '67988888888',
        'atualizado@email.com',
        2,
        6,
        7
    );

    assert.equal(id, 1);

    expect(db.beginTransaction).toHaveBeenCalledTimes(1);
    expect(db.execute).toHaveBeenCalledTimes(3);
    expect(db.commit).toHaveBeenCalledTimes(1);
    expect(db.rollback).not.toHaveBeenCalled();

    expect(db.execute.mock.calls[0][1]).toEqual([
        'Cliente Atualizado',
        '12345678901',
        'Rua Atualizada',
        '67988888888',
        'atualizado@email.com',
        1
    ]);

    expect(db.execute.mock.calls[2][1]).toEqual([
        2,
        6,
        7,
        1
    ]);
});

// Testar atualização de cliente inexistente
test('salvar deve retornar erro quando o cliente não for encontrado', async () => {
    db.execute.mockResolvedValueOnce([{ affectedRows: 0 }]);

    await expect(
        clientesRepository.salvar(
            99,
            'Cliente Teste',
            '12345678901',
            'Rua Teste',
            '67999999999',
            'teste@email.com',
            1.5,
            4,
            5
        )
    ).rejects.toThrow('Cliente não encontrado.');

    expect(db.commit).not.toHaveBeenCalled();
    expect(db.rollback).toHaveBeenCalledTimes(1);
});

// Testar erro durante a transação
test('salvar deve executar rollback quando ocorrer um erro no banco', async () => {
    const erroEsperado = new Error('Erro simulado no banco de dados');

    db.execute.mockRejectedValueOnce(erroEsperado);

    await expect(
        clientesRepository.salvar(
            null,
            'Cliente Teste',
            '12345678901',
            'Rua Teste',
            '67999999999',
            'teste@email.com',
            1.5,
            4,
            5
        )
    ).rejects.toBe(erroEsperado);

    expect(db.rollback).toHaveBeenCalledTimes(1);
    expect(db.commit).not.toHaveBeenCalled();
});

// Testar busca de cliente pelo CPF
test('buscar deve retornar o cliente encontrado', async () => {
    const clienteEsperado = {
        idCliente: 1,
        nome: 'Cliente Teste',
        cpf: '12345678901',
        endereco: 'Rua Teste',
        telefone: '67999999999',
        email: 'teste@email.com',
        profundidade: 1.5,
        lado1: 4,
        lado2: 5
    };

    con.query.mockImplementation((sql, parametros, callback) => {
        callback(null, [clienteEsperado]);
    });

    const cliente = await clientesRepository.buscar('12345678901');

    assert.deepEqual(cliente, clienteEsperado);

    expect(con.query).toHaveBeenCalledTimes(1);
    expect(con.query.mock.calls[0][1]).toEqual(['12345678901']);
});

// Testar busca de cliente inexistente
test('buscar deve retornar null quando o cliente não for encontrado', async () => {
    con.query.mockImplementation((sql, parametros, callback) => {
        callback(null, []);
    });

    const cliente = await clientesRepository.buscar('12345678901');

    assert.equal(cliente, null);
});

// Testar erro durante busca no banco de dados
test('buscar deve rejeitar a promise quando ocorrer um erro no banco', async () => {
    const erroEsperado = new Error('Erro simulado no banco de dados');

    con.query.mockImplementation((sql, parametros, callback) => {
        callback(erroEsperado, null);
    });

    await expect(
        clientesRepository.buscar('12345678901')
    ).rejects.toBe(erroEsperado);
});

// Testar listagem de clientes
test('listar deve retornar todos os clientes', async () => {
    const clientesEsperados = [
        {
            idCliente: 1,
            nome: 'Ana',
            cpf: '12345678901',
            endereco: 'Rua A',
            telefone: '67999999999',
            email: 'ana@email.com',
            volume: 30
        },
        {
            idCliente: 2,
            nome: 'Carlos',
            cpf: '98765432100',
            endereco: 'Rua B',
            telefone: '67988888888',
            email: 'carlos@email.com',
            volume: 50
        }
    ];

    con.query.mockImplementation((sql, callback) => {
        callback(null, clientesEsperados);
    });

    const clientes = await clientesRepository.listar();

    assert.deepEqual(clientes, clientesEsperados);

    expect(con.query).toHaveBeenCalledTimes(1);
});

// Testar erro durante listagem no banco de dados
test('listar deve rejeitar a promise quando ocorrer um erro no banco', async () => {
    const erroEsperado = new Error('Erro simulado no banco de dados');

    con.query.mockImplementation((sql, callback) => {
        callback(erroEsperado, null);
    });

    await expect(
        clientesRepository.listar()
    ).rejects.toBe(erroEsperado);
});
