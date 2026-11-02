const assert = require('node:assert/strict');

jest.mock('../../src/services/produtosService', () => ({
    listar: jest.fn(),
    buscar: jest.fn(),
    atualizar: jest.fn()
}));

const produtosService = require('../../src/services/produtosService');
const produtosController = require('../../src/controllers/produtosController');

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

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

// Testar listagem de produtos
test('listar deve retornar todos os produtos', async () => {
    const produtosEsperados = [
        { idProduto: 1, tipo: 'Cloro', quantidade: 5000 },
        { idProduto: 2, tipo: 'Elevador de pH', quantidade: 3000 }
    ];

    produtosService.listar.mockResolvedValue(produtosEsperados);

    const { req, res } = criarMocksExpress();

    await produtosController.listar(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, produtosEsperados);

    expect(produtosService.listar).toHaveBeenCalledTimes(1);
});

// Testar erro durante listagem de produtos
test('listar deve retornar erro 500 quando ocorrer uma falha no serviço', async () => {
    produtosService.listar.mockRejectedValue(
        new Error('Erro simulado no banco de dados')
    );

    const { req, res } = criarMocksExpress();

    await produtosController.listar(req, res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, {
        erro: 'Erro ao consultar produtos.'
    });
});

// Testar busca de produto pelo tipo
test('buscar deve retornar o produto encontrado', async () => {
    const produtoEsperado = {
        idProduto: 1,
        tipo: 'Cloro',
        quantidade: 5000
    };

    produtosService.buscar.mockResolvedValue(produtoEsperado);

    const { req, res } = criarMocksExpress({
        query: {
            tipo: 'Cloro'
        }
    });

    await produtosController.buscar(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, produtoEsperado);

    expect(produtosService.buscar).toHaveBeenCalledTimes(1);
    expect(produtosService.buscar).toHaveBeenCalledWith('Cloro');
});

// Testar busca sem informar o tipo do produto
test('buscar deve retornar erro 400 quando o tipo não for informado', async () => {
    const erro = new Error('Informe o tipo do produto.');
    erro.statusCode = 400;

    produtosService.buscar.mockRejectedValue(erro);

    const { req, res } = criarMocksExpress({
        query: {}
    });

    await produtosController.buscar(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
        erro: 'Informe o tipo do produto.'
    });
});

// Testar produto não encontrado
test('buscar deve retornar erro 404 quando o produto não existir', async () => {
    const erro = new Error('Produto não encontrado.');
    erro.statusCode = 404;

    produtosService.buscar.mockRejectedValue(erro);

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

// Testar erro durante busca de produto
test('buscar deve retornar erro 500 quando ocorrer uma falha no serviço', async () => {
    produtosService.buscar.mockRejectedValue(
        new Error('Erro simulado no banco de dados')
    );

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

// Testar atualização de estoque
test('atualizar deve adicionar quantidade ao estoque com sucesso', async () => {
    produtosService.atualizar.mockResolvedValue({
        affectedRows: 1
    });

    const dados = {
        idProduto: 1,
        quantidade: 1000
    };

    const { req, res } = criarMocksExpress({
        body: dados
    });

    await produtosController.atualizar(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
        mensagem: 'Estoque atualizado com sucesso.'
    });

    expect(produtosService.atualizar).toHaveBeenCalledTimes(1);
    expect(produtosService.atualizar).toHaveBeenCalledWith(dados);
});

// Testar dados inválidos durante atualização de estoque
const atualizacoesInvalidas = [
    {
        descricao: 'ID do produto igual a zero',
        dados: { idProduto: 0, quantidade: 1000 }
    },
    {
        descricao: 'ID do produto negativo',
        dados: { idProduto: -1, quantidade: 1000 }
    },
    {
        descricao: 'ID do produto não numérico',
        dados: { idProduto: 'abc', quantidade: 1000 }
    },
    {
        descricao: 'quantidade igual a zero',
        dados: { idProduto: 1, quantidade: 0 }
    },
    {
        descricao: 'quantidade negativa',
        dados: { idProduto: 1, quantidade: -1 }
    },
    {
        descricao: 'quantidade vazia',
        dados: { idProduto: 1, quantidade: '' }
    },
    {
        descricao: 'quantidade decimal',
        dados: { idProduto: 1, quantidade: 1.5 }
    }
];

for (const caso of atualizacoesInvalidas) {
    test(`atualizar deve retornar erro 400 quando houver ${caso.descricao}`, async () => {
        const erro = new Error(
            'Informe um produto válido e uma quantidade inteira maior que zero.'
        );
        erro.statusCode = 400;

        produtosService.atualizar.mockRejectedValue(erro);

        const { req, res } = criarMocksExpress({
            body: caso.dados
        });

        await produtosController.atualizar(req, res);

        assert.equal(res.statusCode, 400);
        assert.deepEqual(res.body, {
            erro: 'Informe um produto válido e uma quantidade inteira maior que zero.'
        });
    });
}

// Testar atualização de produto inexistente
test('atualizar deve retornar erro 404 quando o produto não existir', async () => {
    const erro = new Error('Produto não encontrado.');
    erro.statusCode = 404;

    produtosService.atualizar.mockRejectedValue(erro);

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

// Testar erro durante atualização de estoque
test('atualizar deve retornar erro 500 quando ocorrer uma falha no serviço', async () => {
    produtosService.atualizar.mockRejectedValue(
        new Error('Erro simulado no banco de dados')
    );

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
