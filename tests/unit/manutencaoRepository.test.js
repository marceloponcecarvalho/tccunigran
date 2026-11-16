const mockGetConnection = jest.fn();
const mockPoolExecute = jest.fn();
const mockConnectionExecute = jest.fn();
const mockBeginTransaction = jest.fn();
const mockCommit = jest.fn();
const mockRollback = jest.fn();
const mockRelease = jest.fn();

jest.mock('../../src/config/databasePool', () => ({
    promise: jest.fn(() => ({
        getConnection: mockGetConnection,
        execute: mockPoolExecute
    }))
}));

const repository = require('../../src/repositories/manutencaoRepository');

let mockConnection;
let resultados;

const dadosValidos = () => ({
    idAgendamento: 10,
    dataAtual: '2026-11-15',
    medicoes: {
        ph: 7.4,
        alcalinidade: 80,
        cloro: 1
    },
    produtos: []
});

const agendamentoValido = () => ({
    idAgendamento: 10,
    data: '2026-11-14',
    dataValida: 1,
    idCliente: 5,
    nomeCliente: 'Cliente Teste',
    profundidade: 1.5,
    lado1: 8,
    lado2: 4
});

function enfileirar(...itens) {
    resultados = [...itens];
}

beforeEach(() => {
    jest.clearAllMocks();

    resultados = [];

    mockConnection = {
        execute: mockConnectionExecute,
        beginTransaction: mockBeginTransaction,
        commit: mockCommit,
        rollback: mockRollback,
        release: mockRelease
    };

    mockGetConnection.mockResolvedValue(mockConnection);
    mockBeginTransaction.mockResolvedValue();
    mockCommit.mockResolvedValue();
    mockRollback.mockResolvedValue();

    mockConnectionExecute.mockImplementation(async () => {
        if (resultados.length === 0) {
            throw new Error('Não há resultado de banco preparado para esta consulta.');
        }

        return resultados.shift();
    });
});

describe('salvar', () => {
    test('deve registrar a manutenção, os itens, atualizar o estoque e confirmar a transação', async () => {
        enfileirar(
            [[agendamentoValido()], []],
            [[], []],
            [[{ idProduto: 1, tipo: 'Cloro', quantidade: 500 }]],
            [{ insertId: 20 }],
            [{ affectedRows: 1 }],
            [{ affectedRows: 1 }]
        );

        const dados = dadosValidos();
        dados.produtos = [{
            tipo: 'Cloro',
            quantidadeUtilizada: 100
        }];

        const resultado = await repository.salvar(dados);

        expect(resultado).toEqual({
            idManutencao: 20,
            idAgendamento: 10,
            data: '2026-11-14',
            idCliente: 5
        });

        expect(mockBeginTransaction).toHaveBeenCalledTimes(1);
        expect(mockCommit).toHaveBeenCalledTimes(1);
        expect(mockRollback).not.toHaveBeenCalled();
        expect(mockRelease).toHaveBeenCalledTimes(1);
        expect(mockConnectionExecute).toHaveBeenCalledTimes(6);
    });

    test('deve consolidar produtos repetidos antes de consultar e descontar o estoque', async () => {
        enfileirar(
            [[agendamentoValido()], []],
            [[], []],
            [[{ idProduto: 1, tipo: 'Cloro', quantidade: 500 }]],
            [{ insertId: 20 }],
            [{ affectedRows: 1 }],
            [{ affectedRows: 1 }]
        );

        const dados = dadosValidos();
        dados.produtos = [
            { tipo: 'Cloro', quantidadeUtilizada: 30 },
            { tipo: 'Cloro', quantidadeUtilizada: 70 }
        ];

        await repository.salvar(dados);

        expect(mockConnectionExecute.mock.calls[2][1]).toEqual(['Cloro']);
        expect(mockConnectionExecute.mock.calls[4][1]).toEqual([100, 1, 100]);
        expect(mockConnectionExecute.mock.calls[5][1]).toEqual([20, 1, 100]);
    });

    test('deve ordenar os produtos por tipo antes de bloquear o estoque', async () => {
        enfileirar(
            [[agendamentoValido()], []],
            [[], []],
            [[{ idProduto: 1, tipo: 'Cloro', quantidade: 500 }]],
            [[{ idProduto: 2, tipo: 'Elevador de pH', quantidade: 500 }]],
            [{ insertId: 20 }],
            [{ affectedRows: 1 }],
            [{ affectedRows: 1 }],
            [{ affectedRows: 1 }],
            [{ affectedRows: 1 }]
        );

        const dados = dadosValidos();
        dados.produtos = [
            { tipo: 'Elevador de pH', quantidadeUtilizada: 50 },
            { tipo: 'Cloro', quantidadeUtilizada: 100 }
        ];

        await repository.salvar(dados);

        expect(mockConnectionExecute.mock.calls[2][1]).toEqual(['Cloro']);
        expect(mockConnectionExecute.mock.calls[3][1]).toEqual(['Elevador de pH']);
    });

    test('deve rejeitar agendamento inexistente com status 404', async () => {
        enfileirar([[]]);

        await expect(repository.salvar(dadosValidos())).rejects.toMatchObject({
            message: 'Agendamento não encontrado.',
            statusCode: 404
        });

        expect(mockRollback).toHaveBeenCalledTimes(1);
        expect(mockRelease).toHaveBeenCalledTimes(1);
    });

    test('deve rejeitar agendamento futuro com status 400', async () => {
        enfileirar([[
            { ...agendamentoValido(), dataValida: 0 }
        ]]);

        await expect(repository.salvar(dadosValidos())).rejects.toMatchObject({
            message: 'Não é permitido realizar manutenção em agendamento futuro.',
            statusCode: 400
        });

        expect(mockConnectionExecute).toHaveBeenCalledTimes(1);
        expect(mockRollback).toHaveBeenCalledTimes(1);
    });

    test.each([
        ['cliente ausente', { idCliente: null }],
        ['profundidade nula', { profundidade: null }],
        ['lado 1 nulo', { lado1: null }],
        ['lado 2 nulo', { lado2: null }],
        ['profundidade zero', { profundidade: 0 }],
        ['lado 1 zero', { lado1: 0 }],
        ['lado 2 negativo', { lado2: -1 }]
    ])('deve rejeitar piscina inválida: %s', async (descricao, alteracao) => {
        enfileirar([[
            { ...agendamentoValido(), ...alteracao }
        ]]);

        await expect(repository.salvar(dadosValidos())).rejects.toMatchObject({
            message: 'O cliente não possui uma piscina com dimensões válidas.',
            statusCode: 400
        });

        expect(mockRollback).toHaveBeenCalledTimes(1);
    });

    test('deve rejeitar manutenção já registrada para o agendamento', async () => {
        enfileirar(
            [[agendamentoValido()]],
            [[{ idManutencao: 99 }]]
        );

        await expect(repository.salvar(dadosValidos())).rejects.toMatchObject({
            message: 'Este agendamento já possui uma manutenção registrada.',
            statusCode: 409
        });

        expect(mockRollback).toHaveBeenCalledTimes(1);
    });

    test('deve rejeitar produto inexistente com status 404', async () => {
        enfileirar(
            [[agendamentoValido()], []],
            [[], []],
            [[]]
        );

        const dados = dadosValidos();
        dados.produtos = [{
            tipo: 'Cloro',
            quantidadeUtilizada: 100
        }];

        await expect(repository.salvar(dados)).rejects.toMatchObject({
            message: 'Produto não encontrado: Cloro.',
            statusCode: 404
        });

        expect(mockRollback).toHaveBeenCalledTimes(1);
    });

    test('deve rejeitar produto com cadastro duplicado', async () => {
        enfileirar(
            [[agendamentoValido()], []],
            [[], []],
            [[
                { idProduto: 1, tipo: 'Cloro', quantidade: 500 },
                { idProduto: 2, tipo: 'Cloro', quantidade: 500 }
            ]]
        );

        const dados = dadosValidos();
        dados.produtos = [{
            tipo: 'Cloro',
            quantidadeUtilizada: 100
        }];

        await expect(repository.salvar(dados)).rejects.toMatchObject({
            message: 'Existe mais de um cadastro para o produto Cloro.',
            statusCode: 500
        });

        expect(mockRollback).toHaveBeenCalledTimes(1);
    });

    test('deve informar detalhes quando houver estoque insuficiente', async () => {
        enfileirar(
            [[agendamentoValido()], []],
            [[], []],
            [[{ idProduto: 1, tipo: 'Cloro', quantidade: 40 }]]
        );

        const dados = dadosValidos();
        dados.produtos = [{
            tipo: 'Cloro',
            quantidadeUtilizada: 100
        }];

        await expect(repository.salvar(dados)).rejects.toMatchObject({
            message: 'Estoque insuficiente para um ou mais produtos.',
            statusCode: 409,
            detalhes: [{
                tipo: 'Cloro',
                unidade: 'g',
                quantidadeNecessaria: 100,
                quantidadeDisponivel: 40,
                quantidadeFaltante: 60
            }]
        });

        expect(mockConnectionExecute).toHaveBeenCalledTimes(3);
        expect(mockCommit).not.toHaveBeenCalled();
        expect(mockRollback).toHaveBeenCalledTimes(1);
    });

    test('deve usar unidade vazia para produto sem unidade cadastrada', async () => {
        enfileirar(
            [[agendamentoValido()], []],
            [[], []],
            [[{ idProduto: 9, tipo: 'Produto desconhecido', quantidade: 0 }]]
        );

        const dados = dadosValidos();
        dados.produtos = [{
            tipo: 'Produto desconhecido',
            quantidadeUtilizada: 10
        }];

        await expect(repository.salvar(dados)).rejects.toMatchObject({
            detalhes: [{
                tipo: 'Produto desconhecido',
                unidade: ''
            }]
        });
    });

    test('deve rejeitar falha na atualização do estoque', async () => {
        enfileirar(
            [[agendamentoValido()], []],
            [[], []],
            [[{ idProduto: 1, tipo: 'Cloro', quantidade: 500 }]],
            [{ insertId: 20 }],
            [{ affectedRows: 0 }]
        );

        const dados = dadosValidos();
        dados.produtos = [{
            tipo: 'Cloro',
            quantidadeUtilizada: 100
        }];

        await expect(repository.salvar(dados)).rejects.toMatchObject({
            message: 'Não foi possível atualizar o estoque de Cloro.',
            statusCode: 409
        });

        expect(mockRollback).toHaveBeenCalledTimes(1);
        expect(mockCommit).not.toHaveBeenCalled();
    });

    test('deve tentar rollback quando ocorrer erro durante a transação', async () => {
        const erroBanco = new Error('Falha na consulta');

        mockConnectionExecute.mockRejectedValueOnce(erroBanco);

        await expect(repository.salvar(dadosValidos())).rejects.toBe(erroBanco);

        expect(mockRollback).toHaveBeenCalledTimes(1);
        expect(mockRelease).toHaveBeenCalledTimes(1);
    });

    test('deve anexar erro de rollback ao erro original', async () => {
        const erroBanco = new Error('Falha na consulta');
        const erroRollback = new Error('Falha no rollback');

        mockConnectionExecute.mockRejectedValueOnce(erroBanco);
        mockRollback.mockRejectedValueOnce(erroRollback);

        await expect(repository.salvar(dadosValidos())).rejects.toMatchObject({
            message: 'Falha na consulta',
            erroRollback
        });

        expect(mockRelease).toHaveBeenCalledTimes(1);
    });

    test('não deve tentar rollback se a abertura da transação falhar', async () => {
        mockBeginTransaction.mockRejectedValueOnce(
            new Error('Falha ao iniciar transação')
        );

        await expect(repository.salvar(dadosValidos())).rejects.toThrow(
            'Falha ao iniciar transação'
        );

        expect(mockRollback).not.toHaveBeenCalled();
        expect(mockRelease).toHaveBeenCalledTimes(1);
    });

    test('deve salvar manutenção sem itens quando nenhum produto for necessário', async () => {
        enfileirar(
            [[agendamentoValido()], []],
            [[], []],
            [{ insertId: 30 }]
        );

        const resultado = await repository.salvar(dadosValidos());

        expect(resultado.idManutencao).toBe(30);
        expect(mockConnectionExecute).toHaveBeenCalledTimes(3);
        expect(mockCommit).toHaveBeenCalledTimes(1);
    });
});

describe('listarAgendamentosDisponiveis', () => {
    test('deve consultar e retornar os agendamentos disponíveis até a data informada', async () => {
        const agendamentos = [
            { idAgendamento: 1, nomeCliente: 'Cliente A', volume: 48 }
        ];

        mockPoolExecute.mockResolvedValueOnce([agendamentos]);

        const resultado = await repository.listarAgendamentosDisponiveis(
            '2026-11-15'
        );

        expect(resultado).toEqual(agendamentos);
        expect(mockPoolExecute.mock.calls[0][1]).toEqual(['2026-11-15']);
        expect(mockPoolExecute.mock.calls[0][0]).toContain(
            'm.idManutencao IS NULL'
        );
        expect(mockPoolExecute.mock.calls[0][0]).toContain(
            'ORDER BY a.data, a.horario'
        );
    });

    test('deve retornar lista vazia quando não houver agendamentos disponíveis', async () => {
        mockPoolExecute.mockResolvedValueOnce([[]]);

        await expect(
            repository.listarAgendamentosDisponiveis('2026-11-15')
        ).resolves.toEqual([]);
    });

    test('deve propagar erro do banco', async () => {
        mockPoolExecute.mockRejectedValueOnce(new Error('Erro no banco'));

        await expect(
            repository.listarAgendamentosDisponiveis('2026-11-15')
        ).rejects.toThrow('Erro no banco');
    });
});

describe('buscarDadosAgendamento', () => {
    test('deve retornar os dados do agendamento encontrado', async () => {
        const agendamento = agendamentoValido();

        mockPoolExecute.mockResolvedValueOnce([[agendamento]]);

        const resultado = await repository.buscarDadosAgendamento(10);

        expect(resultado).toEqual(agendamento);
        expect(mockPoolExecute.mock.calls[0][1]).toEqual([10]);
        expect(mockPoolExecute.mock.calls[0][0]).toContain(
            'LEFT JOIN Piscina'
        );
    });

    test('deve retornar null quando o agendamento não existir', async () => {
        mockPoolExecute.mockResolvedValueOnce([[]]);

        await expect(
            repository.buscarDadosAgendamento(999)
        ).resolves.toBeNull();
    });

    test('deve propagar erro do banco', async () => {
        mockPoolExecute.mockRejectedValueOnce(new Error('Erro no banco'));

        await expect(
            repository.buscarDadosAgendamento(10)
        ).rejects.toThrow('Erro no banco');
    });
});
