const produtosRepository = require('../repositories/produtosRepository');

// Listar todos os produtos
async function listar(req, res) {
    try {
        const produtos = await produtosRepository.listar();
        return res.json(produtos);
    } catch (erro) {
        console.error('Erro ao listar produtos:', erro);
        return res.status(500).json({
            erro: 'Erro ao consultar produtos.'
        });
    }
}

// Buscar produto pelo tipo
async function buscar(req, res) {
    try {
        const { tipo } = req.query;

        if (!tipo || !tipo.trim()) {
            return res.status(400).json({
                erro: 'Informe o tipo do produto.'
            });
        }

        const produto = await produtosRepository.buscar(tipo.trim());

        if (!produto) {
            return res.status(404).json({
                erro: 'Produto não encontrado.'
            });
        }

        return res.json(produto);
    } catch (erro) {
        console.error('Erro ao buscar produto:', erro);
        return res.status(500).json({
            erro: 'Erro ao consultar produto.'
        });
    }
}

// Atualizar quantidade em estoque
async function atualizar(req, res) {
    try {
        const { idProduto, quantidade } = req.body;

        if (
            !Number.isInteger(Number(idProduto)) ||
            Number(idProduto) <= 0 ||
            quantidade === undefined ||
            quantidade === null ||
            quantidade === '' ||
            !Number.isInteger(Number(quantidade)) ||
            Number(quantidade) <= 0
        ) {
            return res.status(400).json({
                erro: 'Informe um produto válido e uma quantidade inteira maior que zero.'
            });
        }

        const resultado = await produtosRepository.atualizar(
            Number(idProduto),
            Number(quantidade)
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                erro: 'Produto não encontrado.'
            });
        }

        return res.json({
            mensagem: 'Estoque atualizado com sucesso.'
        });
    } catch (erro) {
        console.error('Erro ao atualizar produto:', erro);
        return res.status(500).json({
            erro: 'Erro ao atualizar quantidade do produto.'
        });
    }
}

module.exports = {
    listar,
    buscar,
    atualizar
};
