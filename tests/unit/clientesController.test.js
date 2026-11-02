
const assert = require('node:assert/strict');

// Simular conexão com o banco de dados
jest.mock('../../src/config/database', () => ({
    query: jest.fn(),
    promise: jest.fn()
}));

const clientesRepository = require('../../src/repositories/clientesRepository');
const clientesController = require('../../src/controllers/clientesController');

afterEach(() => {
    jest.restoreAllMocks();
});

// Criar objetos simulados de requisição e resposta do Express
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

// Criar dados válidos para os testes
function criarDadosCliente(dados = {}) {
    return {
        body: {
            nome: 'Cliente Teste',
            cpf: '12345678901',
            endereco: 'Rua Teste',
            telefone: '67999999999',
            email: 'teste@email.com',
            profundidade: 1.5,
            lado1: 4,
            lado2: 5,
            ...dados
        }
    };
}

// Testar cadastro de cliente com CPF
test('salvar deve cadastrar cliente com sucesso', async () => {
    const mockSalvar = jest.spyOn(clientesRepository, 'salvar')
        .mockResolvedValue(1);

    const { req, res } = criarMocksExpress(criarDadosCliente());

    await clientesController.salvar(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
        sucesso: true,
        idCliente: 1,
        mensagem: 'Cliente salvo com sucesso!'
    });

    expect(mockSalvar).toHaveBeenCalledTimes(1);
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

    const { req, res } = criarMocksExpress(
        criarDadosCliente({
            cpf: '12.345.678/0001-90'
        })
    );

    await clientesController.salvar(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.idCliente, 2);

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

    const { req, res } = criarMocksExpress(
        criarDadosCliente({
            cpf: '123.456.789-01'
        })
    );

    await clientesController.salvar(req, res);

    assert.equal(res.statusCode, 200);
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

        const { req, res } = criarMocksExpress(
            criarDadosCliente({
                cpf: caso.cpf
            })
        );

        await clientesController.salvar(req, res);

        assert.equal(res.statusCode, 400);
        assert.deepEqual(res.body, {
            erro: 'CPF/CNPJ inválido: a quantidade de dígitos deve ser 11 para CPF ou 14 para CNPJ.'
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

        const { req, res } = criarMocksExpress(
            criarDadosCliente(caso.dados)
        );

        await clientesController.salvar(req, res);

        assert.equal(res.statusCode, 400);
        assert.equal(
            res.body.erro,
            'Existem campos que precisam ser corrigidos.'
        );
        assert.ok(res.body.camposInvalidos.includes(caso.campo));

        expect(mockSalvar).not.toHaveBeenCalled();
    });
}

// Testar erro de CPF/CNPJ duplicado
test('salvar deve retornar erro quando o CPF/CNPJ já estiver cadastrado', async () => {
    const erro = new Error('Chave duplicada');
    erro.code = 'ER_DUP_ENTRY';

    jest.spyOn(clientesRepository, 'salvar')
        .mockRejectedValue(erro);

    jest.spyOn(console, 'log').mockImplementation(() => {});

    const { req, res } = criarMocksExpress(criarDadosCliente());

    await clientesController.salvar(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
        erro: 'CPF/CNPJ já cadastrado.'
    });
});

// Testar erro genérico ao salvar cliente
test('salvar deve retornar erro quando ocorrer uma falha no repository', async () => {
    jest.spyOn(clientesRepository, 'salvar')
        .mockRejectedValue(new Error('Erro simulado no banco de dados'));

    jest.spyOn(console, 'log').mockImplementation(() => {});

    const { req, res } = criarMocksExpress(criarDadosCliente());

    await clientesController.salvar(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
        erro: 'Erro ao salvar cliente: Erro simulado no banco de dados'
    });
});

// Testar busca de cliente pelo CPF
test('buscar deve retornar o cliente encontrado', async () => {
    const clienteEsperado = {
        idCliente: 1,
        nome: 'Cliente Teste',
        cpf: '12345678901'
    };

    const mockBuscar = jest.spyOn(clientesRepository, 'buscar')
        .mockResolvedValue(clienteEsperado);

    const { req, res } = criarMocksExpress({
        query: {
            cpf: '123.456.789-01'
        }
    });

    await clientesController.buscar(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, clienteEsperado);

    expect(mockBuscar).toHaveBeenCalledTimes(1);
    expect(mockBuscar).toHaveBeenCalledWith('12345678901');
});

// Testar erro durante busca no repository
test('buscar deve retornar erro 500 quando ocorrer uma falha no repository', async () => {
    jest.spyOn(clientesRepository, 'buscar')
        .mockRejectedValue(new Error('Erro simulado no banco de dados'));

    jest.spyOn(console, 'log').mockImplementation(() => {});

    const { req, res } = criarMocksExpress({
        query: {
            cpf: '12345678901'
        }
    });

    await clientesController.buscar(req, res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, {
        erro: 'Erro ao consultar o banco de dados.'
    });
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

    jest.spyOn(console, 'log').mockImplementation(() => {});

    const { req, res } = criarMocksExpress();

    await clientesController.listar(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, clientesEsperados);

    expect(mockListar).toHaveBeenCalledTimes(1);
});

// Testar erro durante listagem no repository
test('listar deve retornar erro 500 quando ocorrer uma falha no repository', async () => {
    jest.spyOn(clientesRepository, 'listar')
        .mockRejectedValue(new Error('Erro simulado no banco de dados'));

    jest.spyOn(console, 'log').mockImplementation(() => {});

    const { req, res } = criarMocksExpress();

    await clientesController.listar(req, res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, {
        erro: 'Erro ao listar clientes.'
    });
});

// Testar busca sem informar CPF
test('buscar deve utilizar string vazia quando CPF não for informado', async () => {
    jest.spyOn(clientesRepository, 'buscar')
        .mockResolvedValue(null);

    const { req, res } = criarMocksExpress();
    req.query = {};

    await clientesController.buscar(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body, null);

    expect(clientesRepository.buscar).toHaveBeenCalledWith('');
});