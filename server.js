require('dotenv').config();

const http = require('http');
const fs = require('fs');
const url = require('url');
const S = require('string');

var mysql = require('mysql2');
var formidable = require('formidable');

// conexao ao banco de dados passou ao arquivo conexao.js
const con = require('./database/conexao');


// criar o servidor http
const server = http.createServer((request, response) => {

    console.log("Requisição:", request.method, request.url);

// pagina de login - template para teste futuro
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

// rotas para consulta e alteração dos clientes e piscinas no SQL

// Criar e Alterar cliente e piscina
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

            // utiliza apenas os numeros recebidos no campo CPF - complementa a verificação que já temos no html
            const cpf = (campo("cpf") || "").replace(/\D/g, "");
            const endereco = campo("endereco");
            const telefone = campo("telefone");
            const email = campo("email");

            const profundidade = Number(campo("profundidade"));
            const lado1 = Number(campo("lado1"));
            const lado2 = Number(campo("lado2"));

            // confere a quantidade de digitos do CPF e retornar erro sem continuar a gravação - também complementa a verificação que já temos no html
            if (![11, 14].includes(cpf.length)) {
                response.writeHead(400, {
                    'Content-Type': 'application/json; charset=utf-8'
                });

                response.end(JSON.stringify({
                    erro: "CPF/CNPJ inválido: a quantidade de dígitos deve ser 11 para CPF ou 14 para CNPJ."
                }));
                return;
            }

            // confereme se os campos sao validos
            const camposInvalidos = [];

            if (!nome) camposInvalidos.push("nome");
            if (!cpf) camposInvalidos.push("cpf");
            if (!endereco) camposInvalidos.push("endereco");

            if (![11, 14].includes(cpf.length)) {
                camposInvalidos.push("cpf");
            }

            if (!Number.isFinite(profundidade) || profundidade <= 0) {
                camposInvalidos.push("profundidade");
            }

            if (!Number.isFinite(lado1) || lado1 <= 0) {
                camposInvalidos.push("lado1");
            }

            if (!Number.isFinite(lado2) || lado2 <= 0) {
                camposInvalidos.push("lado2");
            }

            if (camposInvalidos.length > 0) {
                response.writeHead(400, {
                    'Content-Type': 'application/json; charset=utf-8'
                });

            // Incluida a função para negritar o campo que deve ser corrigido, retornando a mensagem para tratamento pelo html
                response.end(JSON.stringify({
                    erro: "Existem campos que precisam ser corrigidos.",
                    camposInvalidos
                }));

                return;
            }

            /*
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
            */

            // acessa a conexao com o Banco de Dados - transferir depois para clientes.js
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


    // Rota para pesquisar cliente por cpf 
    } else if (request.method == "GET" &&
        request.url.startsWith("/clientes/buscar")) {

        const q = url.parse(request.url, true);
        const cpf = (q.query.cpf || "").replace(/\D/g, "");

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

        // - transferir operações de BD para clientes.js
        con.query(sql, [cpf], (err, result) => {
            if (err) {
                console.log("Erro ao consultar cliente:", err);

                response.writeHead(500, {
                    'Content-Type': 'application/json; charset=utf-8'
                });

                response.end(JSON.stringify({
                    erro: "Erro ao consultar o banco de dados."
                }));
                return;
            }

            response.writeHead(200, {
                'Content-Type': 'application/json; charset=utf-8'
            });

            response.end(JSON.stringify(result[0] || null));
        });

    // Rota para listar todos os clientes
    } else if (request.method == "GET" &&
        url.parse(request.url).pathname == "/clientes/listar") {

        console.log("ROTA LISTAR CLIENTES ACESSADA!");

        const sql = `SELECT c.idCliente, c.nome, c.cpf, c.endereco, c.telefone, c.email,
                    ROUND(p.profundidade * p.lado1 * p.lado2, 2) AS volume
                    FROM Cliente c
                    LEFT JOIN Piscina p ON p.idCliente = c.idCliente
                    ORDER BY c.nome
                    `;
        
        // - transferir operações de BD para clientes.js
        con.query(sql, (err, result) => {

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

    // caminho para index.html ou outro
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