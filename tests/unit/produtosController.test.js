
const assert = require('node:assert/strict');

// Simular conexão com o banco de dados
jest.mock('../../src/config/database', () => ({
    query: jest.fn()
}));

const produtosRepository = require('../../src/repositories/produtosRepository');
const produtosController = require('../../src/controllers/produtosController');

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

// Testar busca de produto encontrado
test('buscar deve retornar o produto quando ele existir', async () => {
    const produtoEsperado = {
        idProduto: 1,
        tipo: 'Cloro',
        quantidade: 4000
    };

    const mockBuscar = jest.spyOn(produtosRepository, 'buscar')
        .mockResolvedValue(produtoEsperado);

    const { req, res } = criarMocksExpress({
        query: {
            tipo: 'Cloro'
        }
    });

    await produtosController.buscar(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, produtoEsperado);
    expect(mockBuscar).toHaveBeenCalledTimes(1);
    expect(mockBuscar).toHaveBeenCalledWith('Cloro');
});

// Testar busca de produto inexistente
test('buscar deve retornar erro 404 quando o produto não existir', async () => {
    jest.spyOn(produtosRepository, 'buscar')
        .mockResolvedValue(null);

    const { req, res } = criarMocksExpress({
        query: {
            tipo: 'Produto inexistente'
        }
    });

    await produtosController.buscar(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, {
        erro: 'Produto não encontrado.'
    });
});

// Testar busca sem informar o tipo
test('buscar deve retornar erro 400 quando o tipo não for informado', async () => {
    const { req, res } = criarMocksExpress({
        query: {}
    });

    await produtosController.buscar(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
        erro: 'Informe o tipo do produto.'
    });
});

// Testar busca com tipo contendo apenas espaços
test('buscar deve retornar erro 400 quando o tipo contiver apenas espaços', async () => {
    const { req, res } = criarMocksExpress({
        query: {
            tipo: '   '
        }
    });

    await produtosController.buscar(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
        erro: 'Informe o tipo do produto.'
    });
});

// Testar atualização de estoque bem-sucedida
test('atualizar deve adicionar quantidade ao estoque com sucesso', async () => {
    const mockAtualizar = jest.spyOn(produtosRepository, 'atualizar')
        .mockResolvedValue({ affectedRows: 1 });

    const { req, res } = criarMocksExpress({
        body: {
            idProduto: 1,
            quantidade: 2000
        }
    });

    await produtosController.atualizar(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
        mensagem: 'Estoque atualizado com sucesso.'
    });

    expect(mockAtualizar).toHaveBeenCalledTimes(1);
    expect(mockAtualizar).toHaveBeenCalledWith(1, 2000);
});

// Testes de validação da atualização de estoque
const dadosInvalidos = [
    {
        descricao: 'ID de produto inválido',
        body: { idProduto: 'abc', quantidade: 1000 }
    },
    {
        descricao: 'quantidade zero',
        body: { idProduto: 1, quantidade: 0 }
    },
    {
        descricao: 'quantidade negativa',
        body: { idProduto: 1, quantidade: -1000 }
    },
    {
        descricao: 'quantidade decimal',
        body: { idProduto: 1, quantidade: 1000.5 }
    }
];

for (const caso of dadosInvalidos) {
    test(`atualizar deve rejeitar ${caso.descricao}`, async () => {
        const mockAtualizar = jest.spyOn(produtosRepository, 'atualizar')
            .mockResolvedValue({ affectedRows: 1 });

        const { req, res } = criarMocksExpress({
            body: caso.body
        });

        await produtosController.atualizar(req, res);

        assert.equal(res.statusCode, 400);
        expect(mockAtualizar).not.toHaveBeenCalled();
    });
}

// Testar atualização de produto inexistente
test('atualizar deve retornar erro 404 quando o produto não existir', async () => {
    jest.spyOn(produtosRepository, 'atualizar')
        .mockResolvedValue({ affectedRows: 0 });

    const { req, res } = criarMocksExpress({
        body: {
            idProduto: 999,
            quantidade: 1000
        }
    });

    await produtosController.atualizar(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, {
        erro: 'Produto não encontrado.'
    });
});

// Testar erro durante atualização no repository
test('atualizar deve retornar erro 500 quando ocorrer uma falha no repository', async () => {
    jest.spyOn(produtosRepository, 'atualizar')
        .mockRejectedValue(new Error('Erro simulado no banco de dados'));

    jest.spyOn(console, 'error').mockImplementation(() => {});

    const { req, res } = criarMocksExpress({
        body: {
            idProduto: 1,
            quantidade: 1000
        }
    });

    await produtosController.atualizar(req, res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, {
        erro: 'Erro ao atualizar quantidade do produto.'
    });
});

// Testar listagem de produtos
test('listar deve retornar todos os produtos', async () => {
    const produtosEsperados = [
        { idProduto: 1, tipo: 'Cloro', quantidade: 4000 },
        { idProduto: 2, tipo: 'Redutor de alcalinidade e pH', quantidade: 2000 }
    ];

    const mockListar = jest.spyOn(produtosRepository, 'listar')
        .mockResolvedValue(produtosEsperados);

    const { req, res } = criarMocksExpress();

    await produtosController.listar(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, produtosEsperados);
    expect(mockListar).toHaveBeenCalledTimes(1);
});

// Testar erro durante listagem no repository
test('listar deve retornar erro 500 quando ocorrer uma falha no repository', async () => {
    const erroEsperado = new Error('Erro simulado no banco de dados');

    jest.spyOn(produtosRepository, 'listar')
        .mockRejectedValue(erroEsperado);

    const mockConsoleError = jest.spyOn(console, 'error')
        .mockImplementation(() => {});

    const { req, res } = criarMocksExpress();

    await produtosController.listar(req, res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, {
        erro: 'Erro ao consultar produtos.'
    });

    expect(mockConsoleError).toHaveBeenCalledWith(
        'Erro ao listar produtos:',
        erroEsperado
    );
});

// Testar erro durante busca no repository
test('buscar deve retornar erro 500 quando ocorrer uma falha no repository', async () => {
    jest.spyOn(produtosRepository, 'buscar')
        .mockRejectedValue(new Error('Erro simulado no banco de dados'));

    jest.spyOn(console, 'error').mockImplementation(() => {});

    const { req, res } = criarMocksExpress({
        query: {
            tipo: 'Cloro'
        }
    });

    await produtosController.buscar(req, res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, {
        erro: 'Erro ao consultar produto.'
    });
});
