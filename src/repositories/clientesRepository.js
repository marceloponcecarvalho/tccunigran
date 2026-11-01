const con = require('../config/database');

// Criar e Alterar cliente e piscina
async function salvar(idCliente, nome, cpf, endereco, telefone, email, profundidade, lado1, lado2) {
    const db = con.promise();

    try {
        await db.beginTransaction();

        let id;

        if (idCliente) {
            // Atualiza cliente existente
            const [resultado] = await db.execute(
                `UPDATE Cliente SET nome = ?, cpf = ?, endereco = ?, telefone = ?, email = ? WHERE idCliente = ?`,
                [nome, cpf, endereco, telefone, email, idCliente]
            );

            if (resultado.affectedRows === 0) {
                throw new Error("Cliente não encontrado.");
            }

            id = idCliente;

        } else {
            // Cadastra novo cliente
            const [resultado] = await db.execute(
                `INSERT INTO Cliente (nome, cpf, endereco, telefone, email) VALUES (?, ?, ?, ?, ?)`,
                [nome, cpf, endereco, telefone, email]
            );

            id = resultado.insertId;
        }

        // Verifica se o cliente já possui piscina
        const [piscinas] = await db.execute(
            "SELECT idPiscina FROM Piscina WHERE idCliente = ?",
            [id]
        );

        if (piscinas.length > 0) {
            await db.execute(
                `UPDATE Piscina SET profundidade = ?, lado1 = ?, lado2 = ? WHERE idCliente = ?`,
                [profundidade, lado1, lado2, id]
            );
        } else {
            await db.execute(
                `INSERT INTO Piscina (profundidade, lado1, lado2, idCliente) VALUES (?, ?, ?, ?)`,
                [profundidade, lado1, lado2, id]
            );
        }

        await db.commit();

        return id;

    } catch (erro) {
        await db.rollback();
        throw erro;
    }
}

// Buscar cliente pelo CPF
function buscar(cpf) {
    // Promises para o controller poder utilizar async/await
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT
                c.idCliente,
                c.nome,
                c.cpf,
                c.endereco,
                c.telefone,
                c.email,
                p.profundidade,
                p.lado1,
                p.lado2
            FROM Cliente c
            LEFT JOIN Piscina p ON p.idCliente = c.idCliente
            WHERE c.cpf = ?
        `;

        con.query(sql, [cpf], (err, result) => {
            if (err) {
                return reject(err);
            }

            resolve(result[0] || null);
        });
    });
}

// Listar todos os clientes
function listar() {
    return new Promise((resolve, reject) => {
        const sql = `SELECT c.idCliente, c.nome, c.cpf, c.endereco, c.telefone, c.email,
                        ROUND(p.profundidade * p.lado1 * p.lado2, 2) AS volume
                        FROM Cliente c
                        LEFT JOIN Piscina p ON p.idCliente = c.idCliente
                        ORDER BY c.nome
                        `;

        con.query(sql, (err, result) => {
            if (err) {
                return reject(err);
            }

            resolve(result);
        });
    });
}

module.exports = {
    salvar,
    buscar,
    listar
};
