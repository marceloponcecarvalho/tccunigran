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
    } else if (request.method == "GET" && request.url == "/clientes/listar") {

        const sql = "SELECT * FROM Cliente ORDER BY nome";

        con.query(sql, (err, result) => {
            if (err) {
                response.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                response.end(JSON.stringify({ erro: err.message }));
                return;
            }

            response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            response.end(JSON.stringify(result));
        });

    } else if (request.method == "POST" &&
        (request.url == "/clientes/cadastrar" || request.url == "/clientes/alterar")) {

        var form = new formidable.IncomingForm();

        form.parse(request, (err, fields, files) => {

            if (err) {
                response.writeHead(500);
                response.end("Erro ao processar formulário.");
                return;
            }

            // Compatibilidade com os valores retornados pelo Formidable
            const campo = (nome) => {
                const valor = fields[nome];
                return Array.isArray(valor) ? valor[0] : valor;
            };

            const nome = campo("nome");
            const cpf = campo("cpf");
            const endereco = campo("endereco");
            const telefone = campo("telefone");
            const email = campo("email");

            if (request.url == "/clientes/cadastrar") {

                const sql = `
                    INSERT INTO Cliente (nome, cpf, endereco, telefone, email)
                    VALUES (?, ?, ?, ?, ?)
                `;

                con.query(sql, [nome, cpf, endereco, telefone, email], (err, result) => {
                    if (err) {
                        response.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
                        response.end("Erro ao cadastrar cliente: " + err.message);
                        return;
                    }

                    console.log("Cliente cadastrado. ID: " + result.insertId);

                    response.writeHead(303, { Location: '/clientes.html' });
                    response.end();
                });

            } else {

                const idCliente = campo("idCliente");

                const sql = `
                    UPDATE Cliente
                    SET nome = ?, cpf = ?, endereco = ?, telefone = ?, email = ?
                    WHERE idCliente = ?
                `;

                con.query(sql, [nome, cpf, endereco, telefone, email, idCliente], (err, result) => {
                    if (err) {
                        response.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
                        response.end("Erro ao alterar cliente: " + err.message);
                        return;
                    }

                    console.log("Cliente alterado. ID: " + idCliente);

                    response.writeHead(303, { Location: '/clientes.html' });
                    response.end();
                });
            }
        });
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