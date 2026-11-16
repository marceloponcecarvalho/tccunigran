const express = require('express');
const request = require('supertest');

jest.mock('../../src/services/authService', () => {
    class AuthError extends Error {
        constructor(message, code) {
            super(message);
            this.name = 'AuthError';
            this.code = code;
        }
    }

    return {
        AuthError,
        criarUsuario: jest.fn(),
        autenticar: jest.fn(),
        alterarCredenciais: jest.fn()
    };
});

jest.mock('../../src/middlewares/authMiddleware', () => ({
    exigirAutenticacao: (req, res, next) => next()
}));

const authService = require('../../src/services/authService');
const router = require('../../src/routes/authRoutes');

let app;
let sessaoAtual;

beforeEach(() => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());

    app.use((req, res, next) => {
        sessaoAtual = {
            usuario: 'admin',
            regenerate: jest.fn(callback => callback(null)),
            save: jest.fn(callback => callback(null)),
            destroy: jest.fn(callback => callback(null))
        };

        req.session = sessaoAtual;
        next();
    });

    app.use('/auth', router);
});

afterEach(() => {
    jest.restoreAllMocks();
});

function erroAuth(message, code) {
    return new authService.AuthError(message, code);
}

// Cadastro inicial

test('cadastro inicial deve rejeitar confirmação de senha diferente', async () => {
    const resposta = await request(app)
        .post('/auth/cadastro-inicial')
        .send({
            usuario: 'admin',
            senha: '1234',
            confirmarSenha: '5678'
        });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toMatch(/confirmação da senha/);
    expect(authService.criarUsuario).not.toHaveBeenCalled();
});

test('cadastro inicial deve criar a conta com sucesso', async () => {
    authService.criarUsuario.mockResolvedValue({
        usuario: 'admin'
    });

    const resposta = await request(app)
        .post('/auth/cadastro-inicial')
        .send({
            usuario: 'admin',
            senha: '1234',
            confirmarSenha: '1234'
        });

    expect(resposta.status).toBe(201);
    expect(resposta.body.usuario).toBe('admin');
    expect(authService.criarUsuario).toHaveBeenCalledWith('admin', '1234');
});

test('cadastro inicial deve responder 409 para conta existente', async () => {
    authService.criarUsuario.mockRejectedValue(
        erroAuth('Conta existente', 'CONTA_EXISTENTE')
    );

    const resposta = await request(app)
        .post('/auth/cadastro-inicial')
        .send({
            usuario: 'admin',
            senha: '1234',
            confirmarSenha: '1234'
        });

    expect(resposta.status).toBe(409);
    expect(resposta.body.codigo).toBe('CONTA_EXISTENTE');
});

test('cadastro inicial deve responder 400 para erro de validação', async () => {
    authService.criarUsuario.mockRejectedValue(
        erroAuth('Usuário inválido', 'USUARIO_INVALIDO')
    );

    const resposta = await request(app)
        .post('/auth/cadastro-inicial')
        .send({
            usuario: 'ab',
            senha: '1234',
            confirmarSenha: '1234'
        });

    expect(resposta.status).toBe(400);
    expect(resposta.body.codigo).toBe('USUARIO_INVALIDO');
});

test('cadastro inicial deve responder 500 para erro inesperado', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    authService.criarUsuario.mockRejectedValue(new Error('Erro interno'));

    const resposta = await request(app)
        .post('/auth/cadastro-inicial')
        .send({
            usuario: 'admin',
            senha: '1234',
            confirmarSenha: '1234'
        });

    expect(resposta.status).toBe(500);
    expect(resposta.body.erro).toMatch(/erro interno/i);
});

// Login

test('login deve rejeitar credenciais inválidas', async () => {
    authService.autenticar.mockResolvedValue(null);

    const resposta = await request(app)
        .post('/auth/login')
        .send({
            usuario: 'admin',
            senha: 'incorreta'
        });

    expect(resposta.status).toBe(401);
    expect(authService.autenticar).toHaveBeenCalledWith('admin', 'incorreta');
    expect(sessaoAtual.regenerate).not.toHaveBeenCalled();
});

test('login deve regenerar e salvar a sessão com sucesso', async () => {
    authService.autenticar.mockResolvedValue({
        usuario: 'admin',
        versao: 3
    });

    const resposta = await request(app)
        .post('/auth/login')
        .send({
            usuario: 'admin',
            senha: '1234'
        });

    expect(resposta.status).toBe(200);
    expect(resposta.body.usuario).toBe('admin');
    expect(sessaoAtual.regenerate).toHaveBeenCalledTimes(1);
    expect(sessaoAtual.save).toHaveBeenCalledTimes(1);
    expect(sessaoAtual.autenticado).toBe(true);
    expect(sessaoAtual.usuario).toBe('admin');
    expect(sessaoAtual.versaoCredenciais).toBe(3);
});

test('login deve responder 500 quando a regeneração da sessão falhar', async () => {
    authService.autenticar.mockResolvedValue({
        usuario: 'admin',
        versao: 1
    });

    jest.spyOn(console, 'error').mockImplementation(() => {});

    sessaoAtual = undefined;

    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
        sessaoAtual = {
            regenerate: jest.fn(callback => callback(new Error('Falha ao regenerar'))),
            save: jest.fn(callback => callback(null))
        };
        req.session = sessaoAtual;
        next();
    });
    app.use('/auth', router);

    const resposta = await request(app)
        .post('/auth/login')
        .send({ usuario: 'admin', senha: '1234' });

    expect(resposta.status).toBe(500);
});

test('login deve responder 500 quando não conseguir salvar a sessão', async () => {
    authService.autenticar.mockResolvedValue({
        usuario: 'admin',
        versao: 1
    });

    jest.spyOn(console, 'error').mockImplementation(() => {});

    sessaoAtual = undefined;

    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
        sessaoAtual = {
            regenerate: jest.fn(callback => callback(null)),
            save: jest.fn(callback => callback(new Error('Falha ao salvar')))
        };
        req.session = sessaoAtual;
        next();
    });
    app.use('/auth', router);

    const resposta = await request(app)
        .post('/auth/login')
        .send({ usuario: 'admin', senha: '1234' });

    expect(resposta.status).toBe(500);
});

test('login deve tratar erro inesperado do serviço', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    authService.autenticar.mockRejectedValue(new Error('Falha no serviço'));

    const resposta = await request(app)
        .post('/auth/login')
        .send({ usuario: 'admin', senha: '1234' });

    expect(resposta.status).toBe(500);
});

// Logout

test('logout deve destruir a sessão e limpar o cookie', async () => {
    const resposta = await request(app)
        .post('/auth/logout');

    expect(resposta.status).toBe(200);
    expect(resposta.body.mensagem).toMatch(/encerrada/i);
    expect(sessaoAtual.destroy).toHaveBeenCalledTimes(1);
    expect(resposta.headers['set-cookie']).toBeDefined();
});

test('logout deve responder 500 quando falhar ao destruir a sessão', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    sessaoAtual = undefined;

    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
        sessaoAtual = {
            destroy: jest.fn(callback => callback(new Error('Falha ao destruir')))
        };
        req.session = sessaoAtual;
        next();
    });
    app.use('/auth', router);

    const resposta = await request(app)
        .post('/auth/logout');

    expect(resposta.status).toBe(500);
});

// Consulta da conta

test('consulta da conta deve retornar o usuário da sessão', async () => {
    const resposta = await request(app)
        .get('/auth/conta');

    expect(resposta.status).toBe(200);
    expect(resposta.body.usuario).toBe('admin');
});

// Alteração da conta

test('alteração da conta deve rejeitar confirmação de senha diferente', async () => {
    const resposta = await request(app)
        .post('/auth/conta')
        .send({
            senhaAtual: '1234',
            novaSenha: '5678',
            confirmarNovaSenha: '9999'
        });

    expect(resposta.status).toBe(400);
    expect(authService.alterarCredenciais).not.toHaveBeenCalled();
});

test('alteração da conta deve atualizar credenciais e encerrar a sessão', async () => {
    authService.alterarCredenciais.mockResolvedValue({
        usuario: 'novoAdmin'
    });

    const resposta = await request(app)
        .post('/auth/conta')
        .send({
            senhaAtual: '1234',
            novoUsuario: 'novoAdmin'
        });

    expect(resposta.status).toBe(200);
    expect(resposta.body.usuario).toBe('novoAdmin');
    expect(authService.alterarCredenciais).toHaveBeenCalledWith({
        usuarioAtual: 'admin',
        senhaAtual: '1234',
        novoUsuario: 'novoAdmin',
        novaSenha: undefined
    });
    expect(sessaoAtual.destroy).toHaveBeenCalledTimes(1);
});

test('alteração da conta deve responder erro de validação do serviço', async () => {
    authService.alterarCredenciais.mockRejectedValue(
        erroAuth('Senha atual incorreta', 'SENHA_ATUAL_INCORRETA')
    );

    const resposta = await request(app)
        .post('/auth/conta')
        .send({ senhaAtual: 'errada', novoUsuario: 'novoAdmin' });

    expect(resposta.status).toBe(400);
    expect(resposta.body.codigo).toBe('SENHA_ATUAL_INCORRETA');
});

test('alteração da conta deve tratar erro inesperado do serviço', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    authService.alterarCredenciais.mockRejectedValue(new Error('Falha interna'));

    const resposta = await request(app)
        .post('/auth/conta')
        .send({ senhaAtual: '1234', novoUsuario: 'novoAdmin' });

    expect(resposta.status).toBe(500);
});

test('alteração da conta deve responder 500 se falhar ao destruir a sessão', async () => {
    authService.alterarCredenciais.mockResolvedValue({
        usuario: 'novoAdmin'
    });

    jest.spyOn(console, 'error').mockImplementation(() => {});

    sessaoAtual = undefined;

    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
        sessaoAtual = {
            destroy: jest.fn(callback => callback(new Error('Falha ao destruir')))
        };
        req.session = sessaoAtual;
        next();
    });
    app.use('/auth', router);

    const resposta = await request(app)
        .post('/auth/conta')
        .send({ senhaAtual: '1234', novoUsuario: 'novoAdmin' });

    expect(resposta.status).toBe(500);
});
