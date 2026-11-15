const pool = require('../config/databasePool');

const UNIDADES = {
    'Cloro': 'g',
    'Elevador de alcalinidade': 'g',
    'Elevador de pH': 'ml',
    'Redutor de alcalinidade e pH': 'ml'
};

// Listar períodos que possuem manutenções registradas
async function listarPeriodos() {
    const db = pool.promise();

    const [periodos] = await db.execute(`
        SELECT DISTINCT
            YEAR(data) AS ano,
            MONTH(data) AS mes
        FROM Manutencao
        ORDER BY ano DESC, mes DESC
    `);

    return periodos;
}

// Listar clientes disponíveis para consulta
async function listarClientes() {
    const db = pool.promise();

    const [clientes] = await db.execute(`
        SELECT idCliente, nome
        FROM Cliente
        ORDER BY nome
    `);

    return clientes;
}

// Relatório mensal de manutenções
async function listarManutencoes(dataInicial, dataFinal) {
    const db = pool.promise();

    const [manutencoes] = await db.execute(`
        SELECT
            m.idManutencao,
            DATE_FORMAT(m.data, '%Y-%m-%d') AS data,
            m.ph,
            m.alcalinidade,
            m.cloro,
            m.idCliente,
            c.nome AS nomeCliente
        FROM Manutencao m
        LEFT JOIN Cliente c
            ON c.idCliente = m.idCliente
        WHERE m.data >= ?
          AND m.data < ?
        ORDER BY m.data, m.idManutencao
    `, [dataInicial, dataFinal]);

    return manutencoes;
}

// Relatório mensal de consumo por produto
async function listarConsumo(dataInicial, dataFinal) {
    const db = pool.promise();

    const [consumo] = await db.execute(`
        SELECT
            p.idProduto,
            p.tipo AS produto,
            SUM(im.quantidadeUtilizada) AS quantidadeUtilizada
        FROM Manutencao m
        INNER JOIN ItemManutencao im
            ON im.idManutencao = m.idManutencao
        INNER JOIN Produto p
            ON p.idProduto = im.idProduto
        WHERE m.data >= ?
          AND m.data < ?
        GROUP BY p.idProduto, p.tipo
        ORDER BY p.tipo
    `, [dataInicial, dataFinal]);

    return consumo.map(item => ({
        ...item,
        unidade: UNIDADES[item.produto] || ''
    }));
}

// Histórico de manutenções de um cliente, incluindo os produtos utilizados
async function listarHistoricoCliente(idCliente) {
    const db = pool.promise();

    const [historico] = await db.execute(`
        SELECT
            m.idManutencao,
            DATE_FORMAT(m.data, '%Y-%m-%d') AS data,
            m.ph,
            m.alcalinidade,
            m.cloro,
            p.tipo AS produto,
            im.quantidadeUtilizada,
            im.idItem
        FROM Manutencao m
        LEFT JOIN ItemManutencao im
            ON im.idManutencao = m.idManutencao
        LEFT JOIN Produto p
            ON p.idProduto = im.idProduto
        WHERE m.idCliente = ?
        ORDER BY m.data DESC, m.idManutencao DESC, p.tipo
    `, [idCliente]);

    return historico.map(item => ({
        ...item,
        unidade: item.produto ? (UNIDADES[item.produto] || '') : null
    }));
}

// Agenda dos próximos 30 dias, incluindo hoje
async function listarAgenda() {
    const db = pool.promise();

    const [agendamentos] = await db.execute(`
        SELECT
            a.idAgendamento,
            DATE_FORMAT(a.data, '%Y-%m-%d') AS data,
            TIME_FORMAT(a.horario, '%H:%i') AS horario,
            a.idCliente,
            c.nome AS nomeCliente
        FROM Agendamento a
        LEFT JOIN Cliente c
            ON c.idCliente = a.idCliente
        WHERE a.data >= CURDATE()
          AND a.data < DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        ORDER BY a.data, a.horario
    `);

    return agendamentos;
}

module.exports = {
    listarPeriodos,
    listarClientes,
    listarManutencoes,
    listarConsumo,
    listarHistoricoCliente,
    listarAgenda
};
