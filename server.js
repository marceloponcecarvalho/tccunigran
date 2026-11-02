require('dotenv').config();
// substituindo http server e rotas manuais por express
const express = require('express');
const path = require('path');
// passei a usar resposta em json
// const formidable = require('formidable');

// conexao ao banco de dados passou ao arquivo conexao.js
// reorganização de pastas
const con = require('./src/config/database');

// importar rotas (movidas para arquivo separado)
const clientesRoutes = require('./src/routes/clientesRoutes');
const produtosRoutes = require('./src/routes/produtosRoutes');

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

// registra as rotas que foram transferidas para o arquivo clientesRoutes
// rotas para consulta e alteração dos clientes e piscinas no SQL
// Criar e Alterar cliente e piscina
// Rota para pesquisar cliente por cpf 
// Rota para listar todos os clientes
app.use('/clientes', clientesRoutes);

// Rotas de produtos
app.use('/produtos', produtosRoutes);

// Rota não encontrada.
app.use((req, res) => {
    res.status(404).send('Pagina invalida');
});

// Inicialização do servidor.
app.listen(PORT, () => {
    console.log(`Servidor Express executando em http://localhost:${PORT}`);
});