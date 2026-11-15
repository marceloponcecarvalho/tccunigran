require('dotenv').config();
// substituindo http server e rotas manuais por express
const express = require('express');
const path = require('path');
const fs = require('node:fs');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
// passei a usar resposta em json
// const formidable = require('formidable');

// conexao ao banco de dados passou ao arquivo conexao.js
// reorganização de pastas
const con = require('./src/config/database');

// importar rotas (movidas para arquivo separado)
const clientesRoutes = require('./src/routes/clientesRoutes');
const produtosRoutes = require('./src/routes/produtosRoutes');
const agendamentosRoutes = require('./src/routes/agendamentosRoutes');
const manutencaoRoutes = require('./src/routes/manutencaoRoutes');
const relatoriosRoutes = require('./src/routes/relatoriosRoutes');
const authRoutes = require('./src/routes/authRoutes');
const authService = require('./src/services/authService');
const { exigirAutenticacao } = require('./src/middlewares/authMiddleware');

// criar o servidor http
const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET não configurado no arquivo .env.');
}

const diretorioSessoes = process.env.SESSION_FILE_STORE_PATH ||
    path.join(__dirname, 'data/sessions');

fs.mkdirSync(diretorioSessoes, {
    recursive: true,
    mode: 0o700
});
fs.chmodSync(diretorioSessoes, 0o700);

const sessionStore = new FileStore({
    path: diretorioSessoes,
    ttl: 8 * 60 * 60,
    reapInterval: process.env.NODE_ENV === 'test' ? -1 : 3600
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    name: 'tccunigran.sid',
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 8 * 60 * 60 * 1000
    }
}));

// Arquivos necessários às telas públicas de autenticação.
app.get('/js/login.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/js/login.js'));
});

app.get('/js/cadastro-inicial.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/js/cadastro-inicial.js'));
});

app.get('/css/auth.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/css/auth.css'));
});

// Página inicial: cadastro inicial, login ou sistema.
app.get('/', async (req, res, next) => {
    try {
        const conta = await authService.obterUsuario();

        if (!conta) {
            return res.redirect('/cadastro-inicial.html');
        }

        if (
            req.session.autenticado === true &&
            req.session.versaoCredenciais === conta.versao
        ) {
            return res.redirect('/index.html');
        }

        return res.redirect('/login.html');
    } catch (erro) {
        next(erro);
    }
});

// O cadastro inicial só pode ser acessado enquanto não existir uma conta.
app.get('/cadastro-inicial.html', async (req, res, next) => {
    try {
        const conta = await authService.obterUsuario();

        if (conta) {
            return res.redirect('/login.html');
        }

        return res.sendFile(path.join(__dirname, 'public/cadastro-inicial.html'));
    } catch (erro) {
        next(erro);
    }
});

// A tela de login não é necessária depois de uma sessão válida.
app.get('/login.html', async (req, res, next) => {
    try {
        const conta = await authService.obterUsuario();

        if (!conta) {
            return res.redirect('/cadastro-inicial.html');
        }

        if (
            req.session.autenticado === true &&
            req.session.versaoCredenciais === conta.versao
        ) {
            return res.redirect('/index.html');
        }

        return res.sendFile(path.join(__dirname, 'public/login.html'));
    } catch (erro) {
        next(erro);
    }
});

// Rotas de autenticação.
app.use('/auth', authRoutes);

// A partir daqui, todas as páginas e APIs exigem autenticação.
app.use(exigirAutenticacao);

// Arquivos estáticos internos, disponíveis somente após autenticação.


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

// Rotas de agendamentos
app.use('/agendamentos', agendamentosRoutes);

// Rotas de manutenção
app.use('/manutencoes', manutencaoRoutes);

// Rotas de relatórios
app.use('/relatorios', relatoriosRoutes);

// Rota não encontrada.
app.use((req, res) => {
    res.status(404).send('Pagina invalida');
});

// Inicialização do servidor.
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Servidor Express executando em http://localhost:${PORT}`);
    });
}

module.exports = app;
