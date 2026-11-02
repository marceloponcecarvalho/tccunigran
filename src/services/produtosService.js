const produtosRepository = require('../repositories/produtosRepository');

// Listar todos os produtos
async function listar() {
    return await produtosRepository.listar();
}

// Buscar produto pelo tipo
async function buscar(tipoInformado) {
    if (!tipoInformado || !tipoInformado.trim()) {
        const erro = new Error('Informe o tipo do produto.');
        erro.statusCode = 400;
        throw erro;
    }

    const tipo = tipoInformado.trim();

    const produto = await produtosRepository.buscar(tipo);

    if (!produto) {
        const erro = new Error('Produto não encontrado.');
        erro.statusCode = 404;
        throw erro;
    }

    return produto;
}

// Atualizar quantidade em estoque
async function atualizar(dados) {
    const { idProduto, quantidade } = dados;

    if (
        !Number.isInteger(Number(idProduto)) ||
        Number(idProduto) <= 0 ||
        quantidade === undefined ||
        quantidade === null ||
        quantidade === '' ||
        !Number.isInteger(Number(quantidade)) ||
        Number(quantidade) <= 0
    ) {
        const erro = new Error(
            'Informe um produto válido e uma quantidade inteira maior que zero.'
        );
        erro.statusCode = 400;
        throw erro;
    }

    const resultado = await produtosRepository.atualizar(
        Number(idProduto),
        Number(quantidade)
    );

    if (resultado.affectedRows === 0) {
        const erro = new Error('Produto não encontrado.');
        erro.statusCode = 404;
        throw erro;
    }

    return resultado;
}

module.exports = {
    listar,
    buscar,
    atualizar
};