const clientesRepository = require('../repositories/clientesRepository');

// Criar e Alterar cliente e piscina
async function salvar(req, res) {
    const idCliente = req.body.idCliente;
    const nome = req.body.nome;

    // utiliza apenas os numeros recebidos no campo CPF - complementa a verificação que já temos no html
    const cpf = (req.body.cpf || "").replace(/\D/g, "");
    const endereco = req.body.endereco;
    const telefone = req.body.telefone;
    const email = req.body.email;

    const profundidade = Number(req.body.profundidade);
    const lado1 = Number(req.body.lado1);
    const lado2 = Number(req.body.lado2);

    // confere a quantidade de digitos do CPF e retornar erro sem continuar a gravação - também complementa a verificação que já temos no html
    if (![11, 14].includes(cpf.length)) {
        return res.status(400).json({
            erro: "CPF/CNPJ inválido: a quantidade de dígitos deve ser 11 para CPF ou 14 para CNPJ."
        });
    }

    // confereme se os campos sao validos
    const camposInvalidos = [];

    if (!nome) camposInvalidos.push("nome");
    if (!cpf) camposInvalidos.push("cpf");
    if (!endereco) camposInvalidos.push("endereco");

    if (![11, 14].includes(cpf.length)) {
        camposInvalidos.push("cpf");
    }

    if (!Number.isFinite(profundidade) || profundidade <= 0) {
        camposInvalidos.push("profundidade");
    }

    if (!Number.isFinite(lado1) || lado1 <= 0) {
        camposInvalidos.push("lado1");
    }

    if (!Number.isFinite(lado2) || lado2 <= 0) {
        camposInvalidos.push("lado2");
    }

    // Incluida a função para negritar o campo que deve ser corrigido, retornando a mensagem para tratamento pelo html
    if (camposInvalidos.length > 0) {
        return res.status(400).json({
            erro: "Existem campos que precisam ser corrigidos.",
            camposInvalidos
        });
    }

    try {
        const id = await clientesRepository.salvar(
            idCliente,
            nome,
            cpf,
            endereco,
            telefone,
            email,
            profundidade,
            lado1,
            lado2
        );

        // tive que susbstituir todos os response. para return res.
        return res.status(200).json({
            sucesso: true,
            idCliente: id,
            mensagem: 'Cliente salvo com sucesso!'
        });

    } catch (erro) {
        console.log(erro);

        return res.status(400).json({
            erro: erro.code === 'ER_DUP_ENTRY'
                ? 'CPF/CNPJ já cadastrado.'
                : 'Erro ao salvar cliente: ' + erro.message
        });
    }
}

// Buscar cliente pelo CPF
async function buscar(req, res) {
    const cpf = (req.query.cpf || '').replace(/\D/g, '');

    try {
        const cliente = await clientesRepository.buscar(cpf);

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
        const clientes = await clientesRepository.listar();

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
