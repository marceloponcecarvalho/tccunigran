const relatoriosRepository = require('../repositories/relatoriosRepository');

// Validar o mês e o ano selecionados
function validarPeriodo(mes, ano) {
    const mesNumerico = Number(mes);
    const anoNumerico = Number(ano);

    if (
        !Number.isInteger(mesNumerico) ||
        mesNumerico < 1 ||
        mesNumerico > 12 ||
        !Number.isInteger(anoNumerico) ||
        anoNumerico < 2000 ||
        anoNumerico > 2100
    ) {
        const erro = new Error('Mês ou ano inválido.');
        erro.statusCode = 400;
        throw erro;
    }

    const mesFormatado = String(mesNumerico).padStart(2, '0');

    return {
        dataInicial: `${anoNumerico}-${mesFormatado}-01`,
        dataFinal: mesNumerico === 12
            ? `${anoNumerico + 1}-01-01`
            : `${anoNumerico}-${String(mesNumerico + 1).padStart(2, '0')}-01`
    };
}

// Validar identificador do cliente
function validarIdCliente(idCliente) {
    const id = Number(idCliente);

    if (!Number.isInteger(id) || id <= 0) {
        const erro = new Error('ID do cliente inválido.');
        erro.statusCode = 400;
        throw erro;
    }

    return id;
}

async function listarPeriodos() {
    return await relatoriosRepository.listarPeriodos();
}

async function listarClientes() {
    return await relatoriosRepository.listarClientes();
}

async function listarManutencoes(mes, ano) {
    const periodo = validarPeriodo(mes, ano);

    return await relatoriosRepository.listarManutencoes(
        periodo.dataInicial,
        periodo.dataFinal
    );
}

async function listarConsumo(mes, ano) {
    const periodo = validarPeriodo(mes, ano);

    return await relatoriosRepository.listarConsumo(
        periodo.dataInicial,
        periodo.dataFinal
    );
}

async function listarHistoricoCliente(idCliente) {
    const id = validarIdCliente(idCliente);

    return await relatoriosRepository.listarHistoricoCliente(id);
}

async function listarAgenda() {
    return await relatoriosRepository.listarAgenda();
}

module.exports = {
    listarPeriodos,
    listarClientes,
    listarManutencoes,
    listarConsumo,
    listarHistoricoCliente,
    listarAgenda
};
