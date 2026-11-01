const con = require('./conexao');

// Cadastrar ou atualizar cliente e piscina
async function salvar(dados) {
    const db = con.promise();

    const {
        idCliente,
        nome,
        cpf,
        endereco,
        telefone,
        email,
        profundidade,
        lado1,
        lado2
    } = dados;

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        let id = idCliente;

        if (idCliente) {
            const [resultado] = await connection.query(
                `UPDATE Cliente
                 SET nome = ?, cpf = ?, endereco = ?,
                     telefone = ?, email = ?
                 WHERE idCliente = ?`,
                [nome, cpf, endereco, telefone, email, idCliente]
            );

            if (resultado.affectedRows === 0) {
                throw new Error("Cliente não encontrado.");
            }
        } else {
            const [resultado] = await connection.query(
                `INSERT INTO Cliente
                 (nome, cpf, endereco, telefone, email)
                 VALUES (?, ?, ?, ?, ?)`,
                [nome, cpf, endereco, telefone, email]
            );

            id = resultado.insertId;
        }

        const [piscinas] = await connection.query(
            `SELECT idPiscina FROM Piscina WHERE idCliente = ?`,
            [id]
        );

        if (piscinas.length > 0) {
            await connection.query(
                `UPDATE Piscina
                 SET profundidade = ?, lado1 = ?, lado2 = ?
                 WHERE idCliente = ?`,
                [profundidade, lado1, lado2, id]
            );
        } else {
            await connection.query(
                `INSERT INTO Piscina
                 (profundidade, lado1, lado2, idCliente)
                 VALUES (?, ?, ?, ?)`,
                [profundidade, lado1, lado2, id]
            );
        }

        await connection.commit();

        return {
            sucesso: true,
            idCliente: id,
            mensagem: "Cliente salvo com sucesso!"
        };

    } catch (erro) {
        await connection.rollback();
        throw erro;

    } finally {
        connection.release();
    }
}

// Buscar cliente pelo CPF/CNPJ
function buscarPorCpf(cpf, callback) {
    const sql = `
        SELECT c.idCliente, c.nome, c.cpf, c.endereco,
               c.telefone, c.email,
               p.profundidade, p.lado1, p.lado2
        FROM Cliente c
        LEFT JOIN Piscina p ON p.idCliente = c.idCliente
        WHERE c.cpf = ?
    `;

    con.query(sql, [cpf], callback);
}

// Listar clientes e volume das piscinas
function listar(callback) {
    const sql = `
        SELECT c.idCliente, c.nome, c.cpf, c.endereco,
               c.telefone, c.email,
               ROUND(p.profundidade * p.lado1 * p.lado2, 2) AS volume
        FROM Cliente c
        LEFT JOIN Piscina p ON p.idCliente = c.idCliente
        ORDER BY c.nome
    `;

    con.query(sql, callback);
}

module.exports = {
    salvar,
    buscarPorCpf,
    listar
};
