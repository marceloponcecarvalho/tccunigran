// repositório passa a ser chamado no service
// const clientesRepository = require('../repositories/clientesRepository');
const clientesService = require('../services/clientesService');

// Criar e Alterar cliente e piscina
async function salvar(req, res) {
    try {
        const id = await clientesService.salvar(req.body);

        // tive que susbstituir todos os response. para return res.
        return res.status(200).json({
            sucesso: true,
            idCliente: id,
            mensagem: 'Cliente salvo com sucesso!'
        });

    } catch (erro) {
        console.log(erro);

        if (erro.message.startsWith('CPF/CNPJ inválido:')) {
            return res.status(400).json({
                erro: erro.message
            });
        }

        if (erro.camposInvalidos && erro.camposInvalidos.length > 0) {
            return res.status(400).json({
                erro: erro.message,
                camposInvalidos: erro.camposInvalidos
            });
        }

        return res.status(400).json({
            erro: erro.code === 'ER_DUP_ENTRY'
                ? 'CPF/CNPJ já cadastrado.'
                : 'Erro ao salvar cliente: ' + erro.message
        });
    }
}

// Buscar cliente pelo CPF
async function buscar(req, res) {
    try {
        const cliente = await clientesService.buscar(req.query.cpf);

        return res.status(200).json(cliente);

    } catch (erro) {
        console.log('Erro ao consultar cliente:', erro);

        return res.status(500).json({
            erro: 'Erro ao consultar o banco de dados.'
        });
    }
}

// Listar todos os clientes
async function listar(req, res) {
    console.log("ROTA LISTAR CLIENTES ACESSADA!");

    try {
        const clientes = await clientesService.listar();

        return res.status(200).json(clientes);

    } catch (erro) {
        console.log(erro);

        return res.status(500).json({
            erro: 'Erro ao listar clientes.'
        });
    }
}

module.exports = {
    salvar,
    buscar,
    listar
};
