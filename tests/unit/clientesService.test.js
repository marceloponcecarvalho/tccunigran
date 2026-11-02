
const assert = require('node:assert/strict');

// Simular conexão com o banco de dados
jest.mock('../../src/config/database', () => ({
    query: jest.fn(),
    promise: jest.fn()
}));

const clientesRepository = require('../../src/repositories/clientesRepository');
const clientesService = require('../../src/services/clientesService');

afterEach(() => {
    jest.restoreAllMocks();
});

// Criar dados válidos para os testes
function criarDadosCliente(dados = {}) {
    return {
        nome: 'Cliente Teste',
        cpf: '12345678901',
        endereco: 'Rua Teste',
        telefone: '67999999999',
        email: 'teste@email.com',
        profundidade: 1.5,
        lado1: 4,
        lado2: 5,
        ...dados
    };
}

// Testar cadastro de cliente com CPF
test('salvar deve cadastrar cliente com sucesso', async () => {
    const mockSalvar = jest.spyOn(clientesRepository, 'salvar')
        .mockResolvedValue(1);

    const dados = criarDadosCliente();

    const id = await clientesService.salvar(dados);

    assert.equal(id, 1);

    expect(mockSalvar).toHaveBeenCalledWith(
        undefined,
        'Cliente Teste',
        '12345678901',
        'Rua Teste',
        '67999999999',
        'teste@email.com',
        1.5,
        4,
        5
    );
});

// Testar cadastro de cliente com CNPJ
test('salvar deve aceitar CNPJ válido', async () => {
    const mockSalvar = jest.spyOn(clientesRepository, 'salvar')
        .mockResolvedValue(2);

    const dados = criarDadosCliente({
        cpf: '12.345.678/0001-90'
    });

    const id = await clientesService.salvar(dados);

    assert.equal(id, 2);

    expect(mockSalvar).toHaveBeenCalledWith(
        undefined,
        'Cliente Teste',
        '12345678000190',
        'Rua Teste',
        '67999999999',
        'teste@email.com',
        1.5,
        4,
        5
    );
});

// Testar normalização do CPF
test('salvar deve remover caracteres não numéricos do CPF', async () => {
    const mockSalvar = jest.spyOn(clientesRepository, 'salvar')
        .mockResolvedValue(1);

    const dados = criarDadosCliente({
        cpf: '123.456.789-01'
    });

    await clientesService.salvar(dados);

    expect(mockSalvar).toHaveBeenCalledWith(
        undefined,
        'Cliente Teste',
        '12345678901',
        'Rua Teste',
        '67999999999',
        'teste@email.com',
        1.5,
        4,
        5
    );
});

// Testar CPF/CNPJ inválido
const documentosInvalidos = [
    {
        descricao: 'documento não informado',
        cpf: ''
    },
    {
        descricao: 'documento com menos de 11 dígitos',
        cpf: '1234567890'
    },
    {
        descricao: 'documento com 12 dígitos',
        cpf: '123456789012'
    },
    {
        descricao: 'documento com 13 dígitos',
        cpf: '1234567890123'
    },
    {
        descricao: 'documento com mais de 14 dígitos',
        cpf: '123456789012345'
    }
];

for (const caso of documentosInvalidos) {
    test(`salvar deve rejeitar ${caso.descricao}`, async () => {
        const mockSalvar = jest.spyOn(clientesRepository, 'salvar')
            .mockResolvedValue(1);

        const dados = criarDadosCliente({
            cpf: caso.cpf
        });

        await expect(clientesService.salvar(dados))
            .rejects.toMatchObject({
                message: 'CPF/CNPJ inválido: a quantidade de dígitos deve ser 11 para CPF ou 14 para CNPJ.',
                camposInvalidos: []
            });

        expect(mockSalvar).not.toHaveBeenCalled();
    });
}

// Testar validação dos campos do cliente e da piscina
const camposInvalidos = [
    {
        descricao: 'nome não informado',
        dados: { nome: '' },
        campo: 'nome'
    },
    {
        descricao: 'endereço não informado',
        dados: { endereco: '' },
        campo: 'endereco'
    },
    {
        descricao: 'profundidade inválida',
        dados: { profundidade: 0 },
        campo: 'profundidade'
    },
    {
        descricao: 'profundidade não numérica',
        dados: { profundidade: 'abc' },
        campo: 'profundidade'
    },
    {
        descricao: 'lado 1 inválido',
        dados: { lado1: -1 },
        campo: 'lado1'
    },
    {
        descricao: 'lado 2 inválido',
        dados: { lado2: 0 },
        campo: 'lado2'
    }
];

for (const caso of camposInvalidos) {
    test(`salvar deve rejeitar quando ${caso.descricao}`, async () => {
        const mockSalvar = jest.spyOn(clientesRepository, 'salvar')
            .mockResolvedValue(1);

        const dados = criarDadosCliente(caso.dados);

        await expect(clientesService.salvar(dados))
            .rejects.toMatchObject({
                message: 'Existem campos que precisam ser corrigidos.',
                camposInvalidos: expect.arrayContaining([caso.campo])
            });

        expect(mockSalvar).not.toHaveBeenCalled();
    });
}

// Testar busca de cliente pelo CPF
test('buscar deve remover caracteres não numéricos do CPF', async () => {
    const clienteEsperado = {
        idCliente: 1,
        nome: 'Cliente Teste',
        cpf: '12345678901'
    };

    const mockBuscar = jest.spyOn(clientesRepository, 'buscar')
        .mockResolvedValue(clienteEsperado);

    const cliente = await clientesService.buscar('123.456.789-01');

    assert.deepEqual(cliente, clienteEsperado);

    expect(mockBuscar).toHaveBeenCalledWith('12345678901');
});

// Testar busca sem informar CPF
test('buscar deve utilizar string vazia quando CPF não for informado', async () => {
    const mockBuscar = jest.spyOn(clientesRepository, 'buscar')
        .mockResolvedValue(null);

    const cliente = await clientesService.buscar(undefined);

    assert.equal(cliente, null);
    expect(mockBuscar).toHaveBeenCalledWith('');
});

// Testar listagem de clientes
test('listar deve retornar todos os clientes', async () => {
    const clientesEsperados = [
        {
            idCliente: 1,
            nome: 'Ana',
            cpf: '12345678901',
            volume: 30
        },
        {
            idCliente: 2,
            nome: 'Carlos',
            cpf: '98765432100',
            volume: 50
        }
    ];

    const mockListar = jest.spyOn(clientesRepository, 'listar')
        .mockResolvedValue(clientesEsperados);

    const clientes = await clientesService.listar();

    assert.deepEqual(clientes, clientesEsperados);
    expect(mockListar).toHaveBeenCalledTimes(1);
});
