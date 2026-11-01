require('dotenv').config();
// substituindo http server e rotas manuais por express
const express = require('express');
const path = require('path');
// passei a usar resposta em json
// const formidable = require('formidable');

// conexao ao banco de dados passou ao arquivo conexao.js
// reorganização de pastas
const con = require('./src/config/database');

// criar o servidor http
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }))

// arquivos html e css movidos para public Disponibiliza os arquivos da pasta public 
app.use(express.static(path.join(__dirname, 'public')));

/* Removido agora que posso usar json
// Processa formulários multipart/form-data.
async function processarFormulario(req) {
    const form = formidable({ multiples: false });
    const [fields, files] = await form.parse(req);

    const campo = (nome) => {
        const valor = fields[nome];
        return Array.isArray(valor) ? valor[0] : valor;
    };

    return { campo, fields, files };
}
*/

// daqui para frent as rotas passam a ser pelo express
/* removido login - ainda não tinha sido implementado
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
*/

// rotas para consulta e alteração dos clientes e piscinas no SQL

// Criar e Alterar cliente e piscina
app.post('/clientes/salvar', async (req, res) => {
    //Antes, o Formidable processava a requisição e disponibilizava os campos através de campo(). 
    // Agora, o middleware express.json() já faz esse trabalho e disponibiliza os dados em req.body.
    const idCliente = req.body.idCliente;
    const nome = req.body.nome;

    // utiliza apenas os numeros recebidos no campo CPF - complementa a verificação que já temos no html
    const cpf = (req.body.cpf || "").replace(/\D/g, "");
    const endereco = req.body.endereco;
    const telefone = req.body.telefone;
    const email = req.body.email;

    const profundidade = Number(req.body.profundidade);
    const lado1 = Number(req.body.lado1);
    const lado2 = Number(req.body.lado2);

    // confere a quantidade de digitos do CPF e retornar erro sem continuar a gravação - também complementa a verificação que já temos no html
    if (![11, 14].includes(cpf.length)) {
        return res.status(400).json({
            erro: "CPF/CNPJ inválido: a quantidade de dígitos deve ser 11 para CPF ou 14 para CNPJ."
        });
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

    // Incluida a função para negritar o campo que deve ser corrigido, retornando a mensagem para tratamento pelo html
    if (camposInvalidos.length > 0) {
        return res.status(400).json({
            erro: "Existem campos que precisam ser corrigidos.",
            camposInvalidos
        });
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

        // tive que susbstituir todos os response. para return res.
        return res.status(200).json({
            sucesso: true,
            idCliente: id,
            mensagem: 'Cliente salvo com sucesso!'
        });

    } catch (erro) {
        await db.rollback();

        console.log(erro);

        return res.status(400).json({
            erro: erro.code === 'ER_DUP_ENTRY'
                ? 'CPF/CNPJ já cadastrado.'
                : 'Erro ao salvar cliente: ' + erro.message
        });
    }
});

// Rota para pesquisar cliente por cpf 
app.get('/clientes/buscar', (req, res) => {
    const cpf = (req.query.cpf || '').replace(/\D/g, '');

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

    // lembrar - transferir operações de BD para clientes.js
    con.query(sql, [cpf], (err, result) => {
        if (err) {
            console.log('Erro ao consultar cliente:', err);

            return res.status(500).json({
                erro: 'Erro ao consultar o banco de dados.'
            });
        }

        return res.status(200).json(result[0] || null);
    });
});


// Rota para listar todos os clientes
app.get('/clientes/listar', (req, res) => {

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

            return res.status(500).json({
                erro: 'Erro ao listar clientes.'
            });
        }

        return res.status(200).json(result);
    });
});

// caminho para index.html ou outro
// Rota não encontrada.
app.use((req, res) => {
    res.status(404).send('Pagina invalida');
});

// Inicialização do servidor.
app.listen(PORT, () => {
    console.log(`Servidor Express executando em http://localhost:${PORT}`);
});