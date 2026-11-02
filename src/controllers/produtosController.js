const produtosService = require('../services/produtosService');

// Listar todos os produtos
async function listar(req, res) {
    try {
        const produtos = await produtosService.listar();
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

        const produto = await produtosService.buscar(tipo);

        return res.json(produto);
    } catch (erro) {
        if (erro.statusCode === 400 || erro.statusCode === 404) {
            return res.status(erro.statusCode).json({
                erro: erro.message
            });
        }

        console.error('Erro ao buscar produto:', erro);
        return res.status(500).json({
            erro: 'Erro ao consultar produto.'
        });
    }
}

// Atualizar quantidade em estoque
async function atualizar(req, res) {
    try {
        await produtosService.atualizar(req.body);

        return res.json({
            mensagem: 'Estoque atualizado com sucesso.'
        });
    } catch (erro) {
        if (erro.statusCode === 400 || erro.statusCode === 404) {
            return res.status(erro.statusCode).json({
                erro: erro.message
            });
        }

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