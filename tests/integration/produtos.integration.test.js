const request = require('supertest');

const app = require('../../server');
const agente = request.agent(app);
const con = require('../../src/config/database');

const db = con.promise();

const tipoTeste = 'Produto Integracao 20261112';

let idProdutoTeste;
let bancoConfirmado = false;

// Preparar os dados utilizados nos testes
beforeAll(async () => {
    const login = await agente
        .post('/auth/login')
        .send({
            usuario: 'usuario_teste',
            senha: 'SenhaTeste123'
        });

    expect(login.status).toBe(200);

    const [bancos] = await db.query('SELECT DATABASE() AS nome');

    if (bancos[0].nome !== 'manutencao_piscinas_test') {
        throw new Error('Os testes devem utilizar somente manutencao_piscinas_test.');
    }

    bancoConfirmado = true;

    const [produto] = await db.execute(
        'INSERT INTO Produto (tipo, quantidade) VALUES (?, ?)',
        [tipoTeste, 1000]
    );

    idProdutoTeste = produto.insertId;
});

// Limpar somente os registros criados pelos testes
afterAll(async () => {
    try {
        if (bancoConfirmado && idProdutoTeste) {
            await db.execute(
                'DELETE FROM Produto WHERE idProduto = ?',
                [idProdutoTeste]
            );
        }
    } finally {
        await new Promise((resolve, reject) => {
            con.end(erro => {
                if (erro) return reject(erro);
                resolve();
            });
        });
    }
});

// Confirmar o banco utilizado
test('deve utilizar o banco de testes', async () => {
    const [bancos] = await db.query('SELECT DATABASE() AS nome');

    expect(bancos[0].nome).toBe('manutencao_piscinas_test');
});

// Listar produtos
test('deve listar produtos cadastrados', async () => {
    const resposta = await agente
        .get('/produtos/listar');

    expect(resposta.status).toBe(200);
    expect(Array.isArray(resposta.body)).toBe(true);

    const produto = resposta.body.find(
        item => item.idProduto === idProdutoTeste
    );

    expect(produto).toBeDefined();
    expect(produto.tipo).toBe(tipoTeste);
    expect(produto.quantidade).toBe(1000);
});

// Buscar produto pelo tipo
test('deve buscar produto pelo tipo', async () => {
    const resposta = await agente
        .get('/produtos/buscar')
        .query({ tipo: tipoTeste });

    expect(resposta.status).toBe(200);
    expect(resposta.body.idProduto).toBe(idProdutoTeste);
    expect(resposta.body.tipo).toBe(tipoTeste);
    expect(resposta.body.quantidade).toBe(1000);
});

// Buscar produto com espaços no tipo informado
test('deve remover espaços extras ao buscar produto', async () => {
    const resposta = await agente
        .get('/produtos/buscar')
        .query({ tipo: `  ${tipoTeste}  ` });

    expect(resposta.status).toBe(200);
    expect(resposta.body.idProduto).toBe(idProdutoTeste);
});

// Rejeitar busca sem informar o tipo
test('não deve buscar produto sem informar o tipo', async () => {
    const resposta = await agente
        .get('/produtos/buscar');

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toBe('Informe o tipo do produto.');
});

// Rejeitar produto inexistente
test('deve retornar erro ao buscar produto inexistente', async () => {
    const resposta = await agente
        .get('/produtos/buscar')
        .query({ tipo: 'Produto Inexistente' });

    expect(resposta.status).toBe(404);
    expect(resposta.body.erro).toBe('Produto não encontrado.');
});

// Atualizar quantidade em estoque
test('deve acrescentar quantidade ao estoque do produto', async () => {
    const resposta = await agente
        .put('/produtos/atualizar')
        .send({
            idProduto: idProdutoTeste,
            quantidade: 2000
        });

    expect(resposta.status).toBe(200);
    expect(resposta.body.mensagem).toBe('Estoque atualizado com sucesso.');

    const [produtos] = await db.execute(
        'SELECT quantidade FROM Produto WHERE idProduto = ?',
        [idProdutoTeste]
    );

    expect(produtos).toHaveLength(1);
    expect(produtos[0].quantidade).toBe(3000);
});

// Rejeitar quantidade inválida
test('não deve atualizar estoque com quantidade inválida', async () => {
    const resposta = await agente
        .put('/produtos/atualizar')
        .send({
            idProduto: idProdutoTeste,
            quantidade: 0
        });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toBe(
        'Informe um produto válido e uma quantidade inteira maior que zero.'
    );

    const [produtos] = await db.execute(
        'SELECT quantidade FROM Produto WHERE idProduto = ?',
        [idProdutoTeste]
    );

    expect(produtos[0].quantidade).toBe(3000);
});

// Rejeitar atualização de produto inexistente
test('não deve atualizar estoque de produto inexistente', async () => {
    const resposta = await agente
        .put('/produtos/atualizar')
        .send({
            idProduto: 2147483647,
            quantidade: 1000
        });

    expect(resposta.status).toBe(404);
    expect(resposta.body.erro).toBe('Produto não encontrado.');
});
