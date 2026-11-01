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
    } else if (request.url == "/clientes/cadastrar" && request.method == "POST") {

        var form = new formidable.IncomingForm();

        form.parse(request, (err, fields, files) => {

            if (err) {
                response.writeHeader(500, { 'Content-Type': 'text/html; charset=utf-8' });
                response.end("Erro ao processar formulário.");
                return;
            }

            const nome = fields.nome[0];
            const cpf = fields.cpf[0];
            const endereco = fields.endereco[0];
            const telefone = fields.telefone[0];
            const email = fields.email[0];

            const sql = `
            INSERT INTO Cliente (nome, cpf, endereco, telefone, email)
            VALUES (?, ?, ?, ?, ?)
        `;

            con.query(sql, [nome, cpf, endereco, telefone, email], (err, result) => {

                if (err) {
                    console.log(err);

                    response.writeHeader(500, { 'Content-Type': 'text/html; charset=utf-8' });
                    response.end("Erro ao cadastrar cliente: " + err.message);
                    return;
                }

                console.log("Cliente cadastrado. ID: " + result.insertId);

                response.writeHeader(200, { 'Content-Type': 'text/html; charset=utf-8' });
                response.end("Cliente cadastrado com sucesso! <a href='/index.html'>Voltar ao início</a>");
            });
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