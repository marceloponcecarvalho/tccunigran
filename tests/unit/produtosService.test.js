
const assert = require('node:assert/strict');

jest.mock('../../src/repositories/produtosRepository', () => ({
    listar: jest.fn(),
    buscar: jest.fn(),
    atualizar: jest.fn()
}));

const produtosRepository = require('../../src/repositories/produtosRepository');
const produtosService = require('../../src/services/produtosService');

beforeEach(() => {
    jest.clearAllMocks();
});

// Testar listagem de produtos
test('listar deve retornar todos os produtos', async () => {
    const produtos = [
        { idProduto: 1, tipo: 'Cloro', quantidade: 5000 },
        { idProduto: 2, tipo: 'Elevador de pH', quantidade: 3000 }
    ];

    produtosRepository.listar.mockResolvedValue(produtos);

    const resultado = await produtosService.listar();

    assert.deepEqual(resultado, produtos);
    expect(produtosRepository.listar).toHaveBeenCalledTimes(1);
});

// Testar busca de produto pelo tipo
test('buscar deve retornar produto pelo tipo informado', async () => {
    const produto = {
        idProduto: 1,
        tipo: 'Cloro',
        quantidade: 5000
    };

    produtosRepository.buscar.mockResolvedValue(produto);

    const resultado = await produtosService.buscar('Cloro');

    assert.deepEqual(resultado, produto);
    expect(produtosRepository.buscar).toHaveBeenCalledWith('Cloro');
});

// Testar remoção de espaços do tipo
test('buscar deve remover espaços antes de consultar o repository', async () => {
    produtosRepository.buscar.mockResolvedValue({
        idProduto: 1,
        tipo: 'Cloro',
        quantidade: 5000
    });

    await produtosService.buscar('  Cloro  ');

    expect(produtosRepository.buscar).toHaveBeenCalledWith('Cloro');
});

// Testar busca sem informar o tipo
test.each([undefined, null, '', '   '])(
    'buscar deve rejeitar tipo inválido: %s',
    async (tipo) => {
        await assert.rejects(
            produtosService.buscar(tipo),
            {
                message: 'Informe o tipo do produto.',
                statusCode: 400
            }
        );

        expect(produtosRepository.buscar).not.toHaveBeenCalled();
    }
);

// Testar produto não encontrado
test('buscar deve retornar erro quando o produto não existir', async () => {
    produtosRepository.buscar.mockResolvedValue(null);

    await assert.rejects(
        produtosService.buscar('Cloro'),
        {
            message: 'Produto não encontrado.',
            statusCode: 404
        }
    );
});

// Testar atualização de estoque
test('atualizar deve acrescentar quantidade ao estoque', async () => {
    const resultadoEsperado = { affectedRows: 1 };

    produtosRepository.atualizar.mockResolvedValue(resultadoEsperado);

    const resultado = await produtosService.atualizar({
        idProduto: '1',
        quantidade: '1000'
    });

    assert.deepEqual(resultado, resultadoEsperado);
    expect(produtosRepository.atualizar).toHaveBeenCalledWith(1, 1000);
});

// Testar validação de quantidade e ID
test.each([
    { idProduto: 0, quantidade: 1000 },
    { idProduto: -1, quantidade: 1000 },
    { idProduto: 'abc', quantidade: 1000 },
    { idProduto: 1.5, quantidade: 1000 },
    { idProduto: 1, quantidade: 0 },
    { idProduto: 1, quantidade: -1 },
    { idProduto: 1, quantidade: '' },
    { idProduto: 1, quantidade: null },
    { idProduto: 1, quantidade: undefined },
    { idProduto: 1, quantidade: 1.5 },
    { idProduto: 1, quantidade: 'abc' }
])(
    'atualizar deve rejeitar dados inválidos: $idProduto / $quantidade',
    async (dados) => {
        await assert.rejects(
            produtosService.atualizar(dados),
            {
                message: 'Informe um produto válido e uma quantidade inteira maior que zero.',
                statusCode: 400
            }
        );

        expect(produtosRepository.atualizar).not.toHaveBeenCalled();
    }
);

// Testar produto inexistente durante atualização
test('atualizar deve retornar erro quando o produto não existir', async () => {
    produtosRepository.atualizar.mockResolvedValue({ affectedRows: 0 });

    await assert.rejects(
        produtosService.atualizar({
            idProduto: 1,
            quantidade: 1000
        }),
        {
            message: 'Produto não encontrado.',
            statusCode: 404
        }
    );
});
