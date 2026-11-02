// Movendo as funções de Normalização do CPF, validações, conversão dos valores e chamada ao repository
// do Controller
const clientesRepository = require('../repositories/clientesRepository');

// Criar e Alterar cliente e piscina
async function salvar(dados) {
    const idCliente = dados.idCliente;
    const nome = dados.nome;

    // utiliza apenas os numeros recebidos no campo CPF - complementa a verificação que já temos no html
    const cpf = (dados.cpf || "").replace(/\D/g, "");
    const endereco = dados.endereco;
    const telefone = dados.telefone;
    const email = dados.email;

    const profundidade = Number(dados.profundidade);
    const lado1 = Number(dados.lado1);
    const lado2 = Number(dados.lado2);

    // confere a quantidade de digitos do CPF e retornar erro sem continuar a gravação - também complementa a verificação que já temos no html
    if (![11, 14].includes(cpf.length)) {
        const erro = new Error("CPF/CNPJ inválido: a quantidade de dígitos deve ser 11 para CPF ou 14 para CNPJ.");
        erro.camposInvalidos = [];
        throw erro;
    }

    // confereme se os campos sao validos
    const camposInvalidos = [];

    if (!nome) camposInvalidos.push("nome");

    if (!endereco) camposInvalidos.push("endereco");

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
        const erro = new Error("Existem campos que precisam ser corrigidos.");
        erro.camposInvalidos = camposInvalidos;
        throw erro;
    }

    return await clientesRepository.salvar(
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
}

// Buscar cliente pelo CPF
async function buscar(cpfInformado) {
    const cpf = (cpfInformado || '').replace(/\D/g, '');

    return await clientesRepository.buscar(cpf);
}

// Listar todos os clientes
async function listar() {
    return await clientesRepository.listar();
}

module.exports = {
    salvar,
    buscar,
    listar
};
