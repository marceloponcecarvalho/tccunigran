const con = require('../config/database');

// Listar todos os agendamentos
async function listar() {
    const db = con.promise();

    const [agendamentos] = await db.execute(`
        SELECT
            a.idAgendamento,
            DATE_FORMAT(a.data, '%Y-%m-%d') AS data,
            TIME_FORMAT(a.horario, '%H:%i') AS horario,
            a.idCliente,
            c.nome AS nomeCliente
        FROM Agendamento a
        LEFT JOIN Cliente c ON c.idCliente = a.idCliente
        ORDER BY a.data, a.horario
    `);

    return agendamentos;
}

// Buscar agendamento pelo ID
async function buscarPorId(idAgendamento) {
    const db = con.promise();

    const [agendamentos] = await db.execute(`
        SELECT
            a.idAgendamento,
            DATE_FORMAT(a.data, '%Y-%m-%d') AS data,
            TIME_FORMAT(a.horario, '%H:%i') AS horario,
            a.idCliente,
            c.nome AS nomeCliente
        FROM Agendamento a
        LEFT JOIN Cliente c ON c.idCliente = a.idCliente
        WHERE a.idAgendamento = ?
    `, [idAgendamento]);

    return agendamentos[0] || null;
}

// Verificar se já existe agendamento para a data e horário
// Ao alterar um agendamento, desconsidera o próprio registro.
async function buscarConflito(data, horario, idAgendamento = null) {
    const db = con.promise();

    let sql = `
        SELECT
            a.idAgendamento,
            DATE_FORMAT(a.data, '%Y-%m-%d') AS data,
            TIME_FORMAT(a.horario, '%H:%i') AS horario,
            a.idCliente,
            c.nome AS nomeCliente
        FROM Agendamento a
        LEFT JOIN Cliente c ON c.idCliente = a.idCliente
        WHERE a.data = ?
          AND a.horario = ?
    `;

    const parametros = [data, horario];

    if (idAgendamento) {
        sql += ' AND a.idAgendamento <> ?';
        parametros.push(idAgendamento);
    }

    sql += ' LIMIT 1';

    const [agendamentos] = await db.execute(sql, parametros);

    return agendamentos[0] || null;
}

// Criar ou atualizar agendamento
async function salvar(idAgendamento, data, horario, idCliente) {
    const db = con.promise();

    if (idAgendamento) {
        // Verifica se o agendamento existe antes de atualizar
        const [agendamentos] = await db.execute(
            'SELECT idAgendamento FROM Agendamento WHERE idAgendamento = ?',
            [idAgendamento]
        );

        if (agendamentos.length === 0) {
            throw new Error('Agendamento não encontrado.');
        }

        await db.execute(`
            UPDATE Agendamento
            SET data = ?, horario = ?, idCliente = ?
            WHERE idAgendamento = ?
        `, [data, horario, idCliente, idAgendamento]);

        return idAgendamento;
    }

    // Cadastrar novo agendamento
    const [resultado] = await db.execute(`
        INSERT INTO Agendamento (data, horario, idCliente)
        VALUES (?, ?, ?)
    `, [data, horario, idCliente]);

    return resultado.insertId;
}

// Excluir agendamento
async function excluir(idAgendamento) {
    const db = con.promise();

    const [resultado] = await db.execute(
        'DELETE FROM Agendamento WHERE idAgendamento = ?',
        [idAgendamento]
    );

    if (resultado.affectedRows === 0) {
        throw new Error('Agendamento não encontrado.');
    }

    return true;
}

module.exports = {
    listar,
    buscarPorId,
    buscarConflito,
    salvar,
    excluir
};
