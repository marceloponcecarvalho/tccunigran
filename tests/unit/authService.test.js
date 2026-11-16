const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

let diretorioTemporario;
let arquivoUsuario;
let authService;
let envAnterior;

beforeEach(async () => {
    envAnterior = process.env.AUTH_USER_FILE;

    diretorioTemporario = await fs.mkdtemp(
        path.join(os.tmpdir(), 'tccunigran-auth-')
    );

    arquivoUsuario = path.join(
        diretorioTemporario,
        'dados',
        'usuario.json'
    );

    process.env.AUTH_USER_FILE = arquivoUsuario;

    jest.resetModules();
    authService = require('../../src/services/authService');
});

afterEach(async () => {
    jest.restoreAllMocks();
    jest.resetModules();

    if (envAnterior === undefined) {
        delete process.env.AUTH_USER_FILE;
    } else {
        process.env.AUTH_USER_FILE = envAnterior;
    }

    await fs.rm(diretorioTemporario, {
        recursive: true,
        force: true
    });
});

async function criarConta(usuario = 'admin', senha = '1234') {
    return authService.criarUsuario(usuario, senha);
}

async function gravarConta(conta) {
    await fs.mkdir(path.dirname(arquivoUsuario), {
        recursive: true
    });

    await fs.writeFile(
        arquivoUsuario,
        JSON.stringify(conta),
        'utf8'
    );
}

// obterUsuario

test('obterUsuario deve retornar null quando o arquivo não existir', async () => {
    assert.equal(await authService.obterUsuario(), null);
});

test('obterUsuario deve retornar os dados da conta', async () => {
    await criarConta('admin', '1234');

    const conta = await authService.obterUsuario();

    assert.equal(conta.usuario, 'admin');
    assert.equal(conta.versao, 1);
    assert.equal(typeof conta.senhaHash, 'string');
    assert.notEqual(conta.senhaHash, '1234');
});

test('obterUsuario deve utilizar versão 1 quando a versão não existir', async () => {
    await gravarConta({
        usuario: 'admin',
        senhaHash: 'hash'
    });

    const conta = await authService.obterUsuario();

    assert.equal(conta.versao, 1);
});

test('obterUsuario deve utilizar versão 1 quando a versão não for inteira', async () => {
    await gravarConta({
        usuario: 'admin',
        senhaHash: 'hash',
        versao: 1.5
    });

    const conta = await authService.obterUsuario();

    assert.equal(conta.versao, 1);
});

test('obterUsuario deve preservar uma versão inteira válida', async () => {
    await gravarConta({
        usuario: 'admin',
        senhaHash: 'hash',
        versao: 7
    });

    const conta = await authService.obterUsuario();

    assert.equal(conta.versao, 7);
});

test('obterUsuario deve rejeitar JSON inválido', async () => {
    await fs.mkdir(path.dirname(arquivoUsuario), {
        recursive: true
    });

    await fs.writeFile(arquivoUsuario, '{ inválido');

    await assert.rejects(
        authService.obterUsuario(),
        SyntaxError
    );
});

test.each([
    ['conteúdo nulo', 'null'],
    ['usuário ausente', JSON.stringify({ senhaHash: 'hash' })],
    ['senha ausente', JSON.stringify({ usuario: 'admin' })],
    ['usuário inválido', JSON.stringify({ usuario: 123, senhaHash: 'hash' })],
    ['hash inválido', JSON.stringify({ usuario: 'admin', senhaHash: 123 })]
])('obterUsuario deve rejeitar conta com %s', async (descricao, conteudo) => {
    await fs.mkdir(path.dirname(arquivoUsuario), {
        recursive: true
    });

    await fs.writeFile(arquivoUsuario, conteudo);

    await assert.rejects(
        authService.obterUsuario(),
        {
            name: 'AuthError',
            code: 'CONTA_INVALIDA'
        }
    );
});

// autenticar

test('autenticar deve retornar null quando não existir conta', async () => {
    assert.equal(
        await authService.autenticar('admin', '1234'),
        null
    );
});

test.each([
    ['usuário não informado', undefined, '1234'],
    ['usuário não textual', 123, '1234'],
    ['senha não informada', 'admin', undefined],
    ['senha não textual', 'admin', 123]
])('autenticar deve retornar null quando houver %s', async (descricao, usuario, senha) => {
    await criarConta();

    assert.equal(
        await authService.autenticar(usuario, senha),
        null
    );
});

test('autenticar deve retornar null para usuário incorreto', async () => {
    await criarConta();

    assert.equal(
        await authService.autenticar('outro', '1234'),
        null
    );
});

test('autenticar deve retornar null para senha incorreta', async () => {
    await criarConta();

    assert.equal(
        await authService.autenticar('admin', 'senhaerrada'),
        null
    );
});

test('autenticar deve retornar os dados do usuário para credenciais válidas', async () => {
    await criarConta('admin', '1234');

    const resultado = await authService.autenticar('admin', '1234');

    assert.deepEqual(resultado, {
        usuario: 'admin',
        versao: 1
    });
});

// criarUsuario

test.each([
    ['usuário não textual', 123, '1234'],
    ['usuário vazio', '', '1234'],
    ['usuário com espaços', '   ', '1234'],
    ['usuário curto', 'ab', '1234']
])('criarUsuario deve rejeitar %s', async (descricao, usuario, senha) => {
    await assert.rejects(
        authService.criarUsuario(usuario, senha),
        {
            name: 'AuthError',
            code: 'USUARIO_INVALIDO'
        }
    );
});

test.each([
    ['senha não textual', 'admin', 123],
    ['senha ausente', 'admin', undefined],
    ['senha curta', 'admin', '123']
])('criarUsuario deve rejeitar %s', async (descricao, usuario, senha) => {
    await assert.rejects(
        authService.criarUsuario(usuario, senha),
        {
            name: 'AuthError',
            code: 'SENHA_INVALIDA'
        }
    );
});

test('criarUsuario deve criar conta e remover espaços do usuário', async () => {
    const resultado = await criarConta('  administrador  ', '1234');

    assert.deepEqual(resultado, {
        usuario: 'administrador',
        versao: 1
    });

    const conta = JSON.parse(
        await fs.readFile(arquivoUsuario, 'utf8')
    );

    assert.equal(conta.usuario, 'administrador');
    assert.equal(conta.versao, 1);
    assert.notEqual(conta.senhaHash, '1234');

    const bcrypt = require('bcrypt');
    assert.equal(
        await bcrypt.compare('1234', conta.senhaHash),
        true
    );
});

test('criarUsuario deve aplicar permissões restritas ao diretório e arquivo', async () => {
    await criarConta();

    const statDiretorio = await fs.stat(path.dirname(arquivoUsuario));
    const statArquivo = await fs.stat(arquivoUsuario);

    assert.equal(statDiretorio.mode & 0o777, 0o700);
    assert.equal(statArquivo.mode & 0o777, 0o600);
});

test('criarUsuario deve bloquear a criação de uma segunda conta', async () => {
    await criarConta();

    await assert.rejects(
        authService.criarUsuario('outro', '5678'),
        {
            name: 'AuthError',
            code: 'CONTA_EXISTENTE'
        }
    );

    const conta = await authService.obterUsuario();

    assert.equal(conta.usuario, 'admin');
});

// alterarCredenciais

test('alterarCredenciais deve rejeitar quando não existir conta', async () => {
    await assert.rejects(
        authService.alterarCredenciais({
            usuarioAtual: 'admin',
            senhaAtual: '1234',
            novoUsuario: 'novo',
            novaSenha: '5678'
        }),
        {
            name: 'AuthError',
            code: 'CONTA_INEXISTENTE'
        }
    );
});

test('alterarCredenciais deve rejeitar usuário atual diferente da conta', async () => {
    await criarConta();

    await assert.rejects(
        authService.alterarCredenciais({
            usuarioAtual: 'outro',
            senhaAtual: '1234',
            novoUsuario: 'novo',
            novaSenha: '5678'
        }),
        {
            name: 'AuthError',
            code: 'SESSAO_INVALIDA'
        }
    );
});

test.each([
    ['senha incorreta', 'errada'],
    ['senha não informada', undefined],
    ['senha não textual', 123]
])('alterarCredenciais deve rejeitar %s', async (descricao, senhaAtual) => {
    await criarConta();

    await assert.rejects(
        authService.alterarCredenciais({
            usuarioAtual: 'admin',
            senhaAtual,
            novoUsuario: 'novo',
            novaSenha: '5678'
        }),
        {
            name: 'AuthError',
            code: 'SENHA_ATUAL_INCORRETA'
        }
    );
});

test('alterarCredenciais deve rejeitar quando nenhuma alteração for informada', async () => {
    await criarConta();

    await assert.rejects(
        authService.alterarCredenciais({
            usuarioAtual: 'admin',
            senhaAtual: '1234'
        }),
        {
            name: 'AuthError',
            code: 'NENHUMA_ALTERACAO'
        }
    );
});

test('alterarCredenciais deve rejeitar usuário curto', async () => {
    await criarConta();

    await assert.rejects(
        authService.alterarCredenciais({
            usuarioAtual: 'admin',
            senhaAtual: '1234',
            novoUsuario: 'ab'
        }),
        {
            name: 'AuthError',
            code: 'USUARIO_INVALIDO'
        }
    );
});

test('alterarCredenciais deve tratar usuário vazio como nenhuma alteração', async () => {
    await criarConta();

    await assert.rejects(
        authService.alterarCredenciais({
            usuarioAtual: 'admin',
            senhaAtual: '1234',
            novoUsuario: '   '
        }),
        {
            name: 'AuthError',
            code: 'NENHUMA_ALTERACAO'
        }
    );
});

test('alterarCredenciais deve rejeitar senha curta', async () => {
    await criarConta();

    await assert.rejects(
        authService.alterarCredenciais({
            usuarioAtual: 'admin',
            senhaAtual: '1234',
            novaSenha: '123'
        }),
        {
            name: 'AuthError',
            code: 'SENHA_INVALIDA'
        }
    );
});

test('alterarCredenciais deve tratar senha vazia como nenhuma alteração', async () => {
    await criarConta();

    await assert.rejects(
        authService.alterarCredenciais({
            usuarioAtual: 'admin',
            senhaAtual: '1234',
            novaSenha: ''
        }),
        {
            name: 'AuthError',
            code: 'NENHUMA_ALTERACAO'
        }
    );
});

test('alterarCredenciais deve alterar somente o usuário', async () => {
    await criarConta('admin', '1234');

    const resultado = await authService.alterarCredenciais({
        usuarioAtual: 'admin',
        senhaAtual: '1234',
        novoUsuario: '  novoAdmin  '
    });

    assert.deepEqual(resultado, {
        usuario: 'novoAdmin',
        versao: 2
    });

    assert.equal(
        await authService.autenticar('novoAdmin', '1234') !== null,
        true
    );

    assert.equal(
        await authService.autenticar('admin', '1234'),
        null
    );
});

test('alterarCredenciais deve alterar somente a senha', async () => {
    await criarConta('admin', '1234');

    const resultado = await authService.alterarCredenciais({
        usuarioAtual: 'admin',
        senhaAtual: '1234',
        novaSenha: '5678'
    });

    assert.deepEqual(resultado, {
        usuario: 'admin',
        versao: 2
    });

    assert.equal(
        await authService.autenticar('admin', '5678') !== null,
        true
    );

    assert.equal(
        await authService.autenticar('admin', '1234'),
        null
    );
});

test('alterarCredenciais deve alterar usuário e senha simultaneamente', async () => {
    await criarConta('admin', '1234');

    const resultado = await authService.alterarCredenciais({
        usuarioAtual: 'admin',
        senhaAtual: '1234',
        novoUsuario: 'novoAdmin',
        novaSenha: '5678'
    });

    assert.deepEqual(resultado, {
        usuario: 'novoAdmin',
        versao: 2
    });

    assert.equal(
        await authService.autenticar('novoAdmin', '5678') !== null,
        true
    );
});

test('alterarCredenciais deve incrementar a versão a cada alteração', async () => {
    await criarConta();

    await authService.alterarCredenciais({
        usuarioAtual: 'admin',
        senhaAtual: '1234',
        novoUsuario: 'novo'
    });

    const resultado = await authService.alterarCredenciais({
        usuarioAtual: 'novo',
        senhaAtual: '1234',
        novaSenha: '5678'
    });

    assert.equal(resultado.versao, 3);
});

test('alterarCredenciais deve aplicar permissões restritas ao arquivo atualizado', async () => {
    await criarConta();

    await authService.alterarCredenciais({
        usuarioAtual: 'admin',
        senhaAtual: '1234',
        novoUsuario: 'novo'
    });

    const statArquivo = await fs.stat(arquivoUsuario);

    assert.equal(statArquivo.mode & 0o777, 0o600);
});

// Tratamento de falhas nas operações de arquivo

test('criarUsuario deve fechar e remover o arquivo quando a gravação falhar', async () => {
    const erro = Object.assign(
        new Error('Falha simulada na gravação'),
        { code: 'EIO' }
    );

    const abrirOriginal = fs.open.bind(fs);

    jest.spyOn(fs, 'open').mockImplementation(async (...args) => {
        const handle = await abrirOriginal(...args);

        return {
            writeFile: jest.fn().mockRejectedValue(erro),
            sync: handle.sync.bind(handle),
            close: jest.fn(() => handle.close())
        };
    });

    await assert.rejects(
        authService.criarUsuario('admin', '1234'),
        erro
    );

    await assert.rejects(
        fs.access(arquivoUsuario),
        { code: 'ENOENT' }
    );
});

test('criarUsuario deve propagar erros diferentes de EEXIST ao abrir o arquivo', async () => {
    const erro = Object.assign(
        new Error('Permissão negada'),
        { code: 'EACCES' }
    );

    jest.spyOn(fs, 'open').mockRejectedValue(erro);

    await assert.rejects(
        authService.criarUsuario('admin', '1234'),
        erro
    );
});

test('alterarCredenciais deve remover o arquivo temporário quando a alteração falhar', async () => {
    await criarConta('admin', '1234');

    const chmodOriginal = fs.chmod.bind(fs);

    jest.spyOn(fs, 'chmod').mockImplementation((arquivo, modo) => {
        if (String(arquivo).endsWith('.tmp')) {
            return Promise.reject(
                new Error('Falha simulada ao ajustar permissões')
            );
        }

        return chmodOriginal(arquivo, modo);
    });

    await assert.rejects(
        authService.alterarCredenciais({
            usuarioAtual: 'admin',
            senhaAtual: '1234',
            novoUsuario: 'novoAdmin'
        }),
        /Falha simulada ao ajustar permissões/
    );

    const arquivos = await fs.readdir(path.dirname(arquivoUsuario));

    assert.equal(
        arquivos.some(nome => nome.endsWith('.tmp')),
        false
    );

    assert.notEqual(
        await authService.autenticar('admin', '1234'),
        null
    );
});

test('authService deve utilizar o caminho padrão quando AUTH_USER_FILE não estiver definida', async () => {
    delete process.env.AUTH_USER_FILE;

    jest.resetModules();

    const erro = Object.assign(
        new Error('Arquivo não encontrado'),
        { code: 'ENOENT' }
    );

    const leitura = jest
        .spyOn(fs, 'readFile')
        .mockRejectedValue(erro);

    const service = require('../../src/services/authService');

    assert.equal(await service.obterUsuario(), null);

    assert.equal(
        leitura.mock.calls[0][0],
        path.resolve(__dirname, '../../data/usuario.json')
    );
});