const agendamentosService = require('../services/agendamentosService');

// Listar todos os agendamentos
async function listar(req, res) {
    try {
        const agendamentos = await agendamentosService.listar();

        return res.status(200).json(agendamentos);
    } catch (erro) {
        console.error('Erro ao listar agendamentos:', erro);

        return res.status(500).json({
            erro: 'Erro ao consultar os agendamentos.'
        });
    }
}

// Buscar agendamento pelo ID
async function buscarPorId(req, res) {
    try {
        const agendamento = await agendamentosService.buscarPorId(
            req.params.id
        );

        return res.status(200).json(agendamento);
    } catch (erro) {
        if (erro.message === 'Agendamento não encontrado.') {
            return res.status(404).json({ erro: erro.message });
        }

        if (erro.message === 'ID do agendamento inválido.') {
            return res.status(400).json({ erro: erro.message });
        }

        console.error('Erro ao buscar agendamento:', erro);

        return res.status(500).json({
            erro: 'Erro ao consultar o agendamento.'
        });
    }
}

// Criar ou atualizar agendamento
async function salvar(req, res) {
    try {
        const { idAgendamento, data, horario, idCliente } = req.body;

        const resultado = await agendamentosService.salvar(
            idAgendamento,
            data,
            horario,
            idCliente
        );

        return res.status(200).json({
            mensagem: idAgendamento
                ? 'Agendamento atualizado com sucesso.'
                : 'Agendamento cadastrado com sucesso.',
            idAgendamento: resultado
        });
    } catch (erro) {
        if (erro.message.startsWith('Horário já ocupado')) {
            return res.status(409).json({ erro: erro.message });
        }

        if (
            erro.message === 'Data inválida.' ||
            erro.message.startsWith('Horário inválido') ||
            erro.message === 'Não é permitido agendar em uma data anterior à atual.' ||
            erro.message === 'Cliente inválido.' ||
            erro.message === 'Cliente não encontrado.' ||
            erro.message === 'ID do agendamento inválido.'
        ) {
            return res.status(400).json({ erro: erro.message });
        }

        if (erro.message === 'Agendamento não encontrado.') {
            return res.status(404).json({ erro: erro.message });
        }

        console.error('Erro ao salvar agendamento:', erro);

        return res.status(500).json({
            erro: 'Erro ao salvar o agendamento.'
        });
    }
}

// Excluir agendamento
async function excluir(req, res) {
    try {
        await agendamentosService.excluir(req.params.id);

        return res.status(200).json({
            mensagem: 'Agendamento excluído com sucesso.'
        });
    } catch (erro) {
        if (erro.message === 'Agendamento não encontrado.') {
            return res.status(404).json({ erro: erro.message });
        }

        if (erro.message === 'ID do agendamento inválido.') {
            return res.status(400).json({ erro: erro.message });
        }

        console.error('Erro ao excluir agendamento:', erro);

        return res.status(500).json({
            erro: 'Erro ao excluir o agendamento.'
        });
    }
}

module.exports = {
    listar,
    buscarPorId,
    salvar,
    excluir
};
