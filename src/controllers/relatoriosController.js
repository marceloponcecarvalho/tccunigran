const relatoriosService = require('../services/relatoriosService');

async function executarConsulta(res, descricao, consulta) {
    try {
        const resultado = await consulta();
        return res.status(200).json(resultado);
    } catch (erro) {
        if (erro.statusCode) {
            return res.status(erro.statusCode).json({
                erro: erro.message
            });
        }

        console.error(`Erro ao consultar ${descricao}:`, erro);

        return res.status(500).json({
            erro: `Erro ao consultar ${descricao}.`
        });
    }
}

async function listarPeriodos(req, res) {
    return executarConsulta(
        res,
        'os períodos disponíveis',
        () => relatoriosService.listarPeriodos()
    );
}

async function listarClientes(req, res) {
    return executarConsulta(
        res,
        'os clientes para os relatórios',
        () => relatoriosService.listarClientes()
    );
}

async function listarManutencoes(req, res) {
    return executarConsulta(
        res,
        'as manutenções do período',
        () => relatoriosService.listarManutencoes(
            req.query.mes,
            req.query.ano
        )
    );
}

async function listarConsumo(req, res) {
    return executarConsulta(
        res,
        'o consumo de produtos do período',
        () => relatoriosService.listarConsumo(
            req.query.mes,
            req.query.ano
        )
    );
}

async function listarHistoricoCliente(req, res) {
    return executarConsulta(
        res,
        'o histórico do cliente',
        () => relatoriosService.listarHistoricoCliente(
            req.params.idCliente
        )
    );
}

async function listarAgenda(req, res) {
    return executarConsulta(
        res,
        'a agenda dos próximos 30 dias',
        () => relatoriosService.listarAgenda()
    );
}

module.exports = {
    listarPeriodos,
    listarClientes,
    listarManutencoes,
    listarConsumo,
    listarHistoricoCliente,
    listarAgenda
};
