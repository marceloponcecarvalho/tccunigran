
const agendamentosRepository = require('../repositories/agendamentosRepository');
const clientesService = require('./clientesService');

const HORARIOS_PERMITIDOS = [
    '05:00',
    '08:00',
    '11:00',
    '14:00',
    '17:00'
];

// Validar o formato e a existência da data no calendário
function validarData(data) {
    if (typeof data !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        throw new Error('Data inválida.');
    }

    const dataInformada = new Date(`${data}T00:00:00Z`);

    if (
        Number.isNaN(dataInformada.getTime()) ||
        dataInformada.toISOString().slice(0, 10) !== data
    ) {
        throw new Error('Data inválida.');
    }

    // Impedir agendamentos com datas anteriores à data atual
    const hoje = new Date();
    const hojeFormatado = [
        hoje.getFullYear(),
        String(hoje.getMonth() + 1).padStart(2, '0'),
        String(hoje.getDate()).padStart(2, '0')
    ].join('-');

    if (data < hojeFormatado) {
        throw new Error('Não é permitido agendar em uma data anterior à atual.');
    }
}

// Validar o horário selecionado
function validarHorario(horario) {
    if (!HORARIOS_PERMITIDOS.includes(horario)) {
        throw new Error('Horário inválido. Selecione um dos horários disponíveis.');
    }
}

// Validar identificadores
function validarId(id, mensagem) {
    const idNumerico = Number(id);

    if (!Number.isInteger(idNumerico) || idNumerico <= 0) {
        throw new Error(mensagem);
    }

    return idNumerico;
}

// Listar agendamentos
async function listar() {
    return await agendamentosRepository.listar();
}

// Buscar agendamento pelo ID
async function buscarPorId(idAgendamento) {
    const id = validarId(idAgendamento, 'ID do agendamento inválido.');

    const agendamento = await agendamentosRepository.buscarPorId(id);

    if (!agendamento) {
        throw new Error('Agendamento não encontrado.');
    }

    return agendamento;
}

// Verificar se o cliente está cadastrado
async function validarCliente(idCliente) {
    const id = validarId(idCliente, 'Cliente inválido.');
    const clientes = await clientesService.listar();

    const clienteExiste = clientes.some(
        cliente => Number(cliente.idCliente) === id
    );

    if (!clienteExiste) {
        throw new Error('Cliente não encontrado.');
    }

    return id;
}

// Criar ou atualizar agendamento
async function salvar(idAgendamento, data, horario, idCliente) {
    let id = null;

    if (idAgendamento !== null && idAgendamento !== undefined && idAgendamento !== '') {
        id = validarId(idAgendamento, 'ID do agendamento inválido.');
    }

    validarData(data);
    validarHorario(horario);

    const cliente = await validarCliente(idCliente);

    const conflito = await agendamentosRepository.buscarConflito(
        data,
        horario,
        id
    );

    if (conflito) {
        const nomeCliente = conflito.nomeCliente || 'outro cliente';

        throw new Error(
            `Horário já ocupado pelo cliente ${nomeCliente}.`
        );
    }

    return await agendamentosRepository.salvar(
        id,
        data,
        horario,
        cliente
    );
}

// Excluir agendamento
async function excluir(idAgendamento) {
    const id = validarId(idAgendamento, 'ID do agendamento inválido.');

    return await agendamentosRepository.excluir(id);
}

module.exports = {
    listar,
    buscarPorId,
    salvar,
    excluir
};
