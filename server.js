require('dotenv').config();

const http = require('http');
const fs = require('fs');
const url = require('url');
const S = require('string');

var mysql = require('mysql2');
var formidable = require('formidable');

var con = mysql.createConnection({
    host: "localhost",
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: "manutencao_piscinas"
});

con.connect(function (err) {
    if (err) throw err;
    console.log("Conectado!");
});

con.query('SELECT * FROM Cliente', function (err, result) {
    if (err) throw err;
    console.log("Result: " + result);
});

const server = http.createServer((request, response) => {

    console.log("Requisição:", request.method, request.url);

    if (request.url == "/login") {
        var form = new formidable.IncomingForm();
        form.parse(request, (err, fields, files) => {
            if (fields.login == "felipe" && fields.senha == "felipe") {
                response.writeHeader(200, { 'Content-Type': 'text/html' });
                response.write(fields.login + ' - ' + fields.senha);
                response.end();
            } else {
                response.writeHeader(200, { 'Content-Type': 'text/html' });
                response.write("Usuario ou senha incorretos!");
                response.end();
            }
        });
    } else if (request.method == "POST" &&
        request.url == "/clientes/salvar") {

        var form = new formidable.IncomingForm();

        form.parse(request, async (err, fields, files) => {

            if (err) {
                response.writeHead(400);
                response.end("Erro ao processar formulário.");
                return;
            }

            const campo = (nome) => {
                const valor = fields[nome];
                return Array.isArray(valor) ? valor[0] : valor;
            };

            const idCliente = campo("idCliente");
            const nome = campo("nome");
            const cpf = campo("cpf");
            const endereco = campo("endereco");
            const telefone = campo("telefone");
            const email = campo("email");

            const profundidade = Number(campo("profundidade"));
            const lado1 = Number(campo("lado1"));
            const lado2 = Number(campo("lado2"));

            const dadosInvalidos =
                !nome || !cpf || !endereco ||
                !Number.isFinite(profundidade) || profundidade <= 0 ||
                !Number.isFinite(lado1) || lado1 <= 0 ||
                !Number.isFinite(lado2) || lado2 <= 0;

            if (dadosInvalidos) {
                response.writeHead(400, {
                    'Content-Type': 'application/json; charset=utf-8'
                });

                response.end(JSON.stringify({
                    erro: "Verifique os campos obrigatórios e as dimensões da piscina."
                }));
                return;
            }

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

                response.writeHead(200, {
                    'Content-Type': 'application/json; charset=utf-8'
                });

                response.end(JSON.stringify({
                    sucesso: true,
                    idCliente: id,
                    mensagem: "Cliente salvo com sucesso!"
                }));

            } catch (erro) {
                await db.rollback();

                console.log(erro);

                response.writeHead(400, {
                    'Content-Type': 'application/json; charset=utf-8'
                });

                response.end(JSON.stringify({
                    erro: erro.code === "ER_DUP_ENTRY"
                        ? "CPF/CNPJ já cadastrado."
                        : "Erro ao salvar cliente: " + erro.message
                }));
            }
        });
    } else if (request.method == "GET" &&
        request.url.startsWith("/clientes/buscar")) {

        const q = url.parse(request.url, true);
        const cpf = q.query.cpf;

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
            response.writeHead(200, {
                'Content-Type': 'application/json; charset=utf-8'
            });

            if (err) {
                response.end(JSON.stringify({ erro: err.message }));
                return;
            }

            response.end(JSON.stringify(result[0] || null));
        });

} else if (request.method == "GET" &&
    url.parse(request.url).pathname == "/clientes/listar") {

    console.log("ROTA LISTAR CLIENTES ACESSADA!");

    con.query(
        `SELECT idCliente, nome, cpf, endereco, telefone, email
         FROM Cliente
         ORDER BY nome`,
        (err, result) => {

            if (err) {
                console.log(err);

                response.writeHead(500, {
                    'Content-Type': 'application/json; charset=utf-8'
                });

                response.end(JSON.stringify({
                    erro: "Erro ao listar clientes."
                }));
                return;
            }

            response.writeHead(200, {
                'Content-Type': 'application/json; charset=utf-8'
            });

            response.end(JSON.stringify(result));
        }
    );

    } else {
        var diretorio = __dirname;
        var q = url.parse(request.url, true);

        // Ao acessar a raiz, carrega a index.html
        var caminho = q.pathname == "/" ? "/index.html" : q.pathname;

        fs.readFile(diretorio + caminho, (erro, html) => {
            if (erro) {
                response.writeHeader(404, { 'Content-Type': 'text/html' });
                response.write("Pagina invalida");
                response.end();
            } else {
                response.writeHeader(200, { 'Content-Type': 'text/html' });
                response.write(html);
                response.end();
            }
        });
    }
});

server.listen(3000);