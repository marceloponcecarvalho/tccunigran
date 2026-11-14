const manutencaoService = require('../services/manutencaoService');

// Listar agendamentos disponíveis para manutenção
async function listarAgendamentosDisponiveis(req, res) {
    try {
        const agendamentos =
            await manutencaoService.listarAgendamentosDisponiveis();

        return res.status(200).json(agendamentos);
    } catch (erro) {
        console.error('Erro ao listar agendamentos para manutenção:', erro);

        return res.status(500).json({
            erro: 'Erro ao consultar os agendamentos disponíveis.'
        });
    }
}

// Calcular dosagens sem registrar a manutenção
async function calcular(req, res) {
    try {
        const { idAgendamento, medicoes } = req.body;

        const resultado = await manutencaoService.calcular(
            idAgendamento,
            medicoes
        );

        return res.status(200).json(resultado);
    } catch (erro) {
        if (erro.statusCode) {
            return res.status(erro.statusCode).json({
                erro: erro.message
            });
        }

        console.error('Erro ao calcular manutenção:', erro);

        return res.status(500).json({
            erro: 'Erro ao calcular a manutenção.'
        });
    }
}

// Confirmar manutenção e atualizar estoque
async function salvar(req, res) {
    try {
        const { idAgendamento, medicoes } = req.body;

        const resultado = await manutencaoService.salvar(
            idAgendamento,
            medicoes
        );

        return res.status(201).json({
            mensagem: 'Manutenção registrada com sucesso.',
            ...resultado
        });
    } catch (erro) {
        if (erro.statusCode) {
            const resposta = { erro: erro.message };

            if (erro.detalhes) {
                resposta.detalhes = erro.detalhes;
            }

            return res.status(erro.statusCode).json(resposta);
        }

        console.error('Erro ao registrar manutenção:', erro);

        return res.status(500).json({
            erro: 'Erro ao registrar a manutenção.'
        });
    }
}

module.exports = {
    listarAgendamentosDisponiveis,
    calcular,
    salvar
};
