
const assert = require('node:assert/strict');

// Simular conexão com o banco de dados
jest.mock('../../src/config/database', () => ({
    query: jest.fn()
}));

const con = require('../../src/config/database');
const produtosRepository = require('../../src/repositories/produtosRepository');

beforeEach(() => {
    jest.clearAllMocks();
});

// Testar listagem de produtos
test('listar deve executar a consulta SQL e retornar os produtos', async () => {
    const produtosEsperados = [
        { idProduto: 1, tipo: 'Cloro', quantidade: 4000 },
        { idProduto: 2, tipo: 'Redutor de alcalinidade e pH', quantidade: 2000 }
    ];

    con.query.mockImplementation((sql, callback) => {
        callback(null, produtosEsperados);
    });

    const resultado = await produtosRepository.listar();

    assert.deepEqual(resultado, produtosEsperados);
    expect(con.query).toHaveBeenCalledWith(
        'SELECT idProduto, tipo, quantidade FROM Produto ORDER BY idProduto',
        expect.any(Function)
    );
});

// Testar erro na listagem
test('listar deve rejeitar a operação quando ocorrer erro no banco', async () => {
    const erroEsperado = new Error('Erro simulado no banco');

    con.query.mockImplementation((sql, callback) => {
        callback(erroEsperado, null);
    });

    await expect(produtosRepository.listar()).rejects.toBe(erroEsperado);
});

// Testar busca de produto existente
test('buscar deve retornar o produto encontrado', async () => {
    const produtoEsperado = {
        idProduto: 1,
        tipo: 'Cloro',
        quantidade: 4000
    };

    con.query.mockImplementation((sql, parametros, callback) => {
        callback(null, [produtoEsperado]);
    });

    const resultado = await produtosRepository.buscar('Cloro');

    assert.deepEqual(resultado, produtoEsperado);
    expect(con.query).toHaveBeenCalledWith(
        'SELECT idProduto, tipo, quantidade FROM Produto WHERE tipo = ?',
        ['Cloro'],
        expect.any(Function)
    );
});

// Testar busca de produto inexistente
test('buscar deve retornar null quando o produto não existir', async () => {
    con.query.mockImplementation((sql, parametros, callback) => {
        callback(null, []);
    });

    const resultado = await produtosRepository.buscar('Produto inexistente');

    assert.equal(resultado, null);
});

// Testar erro na busca
test('buscar deve rejeitar a operação quando ocorrer erro no banco', async () => {
    const erroEsperado = new Error('Erro simulado no banco');

    con.query.mockImplementation((sql, parametros, callback) => {
        callback(erroEsperado, null);
    });

    await expect(
        produtosRepository.buscar('Cloro')
    ).rejects.toBe(erroEsperado);
});

// Testar atualização aditiva do estoque
test('atualizar deve adicionar a quantidade ao estoque do produto', async () => {
    const resultadoEsperado = {
        affectedRows: 1,
        changedRows: 1
    };

    con.query.mockImplementation((sql, parametros, callback) => {
        callback(null, resultadoEsperado);
    });

    const resultado = await produtosRepository.atualizar(1, 2000);

    assert.deepEqual(resultado, resultadoEsperado);
    expect(con.query).toHaveBeenCalledWith(
        'UPDATE Produto SET quantidade = quantidade + ? WHERE idProduto = ?',
        [2000, 1],
        expect.any(Function)
    );
});

// Testar erro na atualização
test('atualizar deve rejeitar a operação quando ocorrer erro no banco', async () => {
    const erroEsperado = new Error('Erro simulado no banco');

    con.query.mockImplementation((sql, parametros, callback) => {
        callback(erroEsperado, null);
    });

    await expect(
        produtosRepository.atualizar(1, 2000)
    ).rejects.toBe(erroEsperado);
});
