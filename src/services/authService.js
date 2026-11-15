const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const bcrypt = require('bcrypt');

const arquivoUsuario = process.env.AUTH_USER_FILE ||
    path.join(__dirname, '../../data/usuario.json');

class AuthError extends Error {
    constructor(message, code) {
        super(message);
        this.name = 'AuthError';
        this.code = code;
    }
}

async function obterUsuario() {
    try {
        const conteudo = await fs.readFile(arquivoUsuario, 'utf8');
        const conta = JSON.parse(conteudo);

        if (
            !conta ||
            typeof conta.usuario !== 'string' ||
            typeof conta.senhaHash !== 'string'
        ) {
            throw new AuthError('Arquivo de conta inválido.', 'CONTA_INVALIDA');
        }

        return {
            usuario: conta.usuario,
            senhaHash: conta.senhaHash,
            versao: Number.isInteger(conta.versao) ? conta.versao : 1
        };
    } catch (erro) {
        if (erro.code === 'ENOENT') {
            return null;
        }

        throw erro;
    }
}

async function autenticar(usuario, senha) {
    const conta = await obterUsuario();

    if (!conta || typeof usuario !== 'string' || typeof senha !== 'string') {
        return null;
    }

    if (usuario !== conta.usuario) {
        return null;
    }

    const senhaValida = await bcrypt.compare(senha, conta.senhaHash);

    if (!senhaValida) {
        return null;
    }

    return {
        usuario: conta.usuario,
        versao: conta.versao
    };
}

async function criarUsuario(usuario, senha) {
    if (typeof usuario !== 'string' || usuario.trim().length < 3) {
        throw new AuthError(
            'O nome de usuário deve ter pelo menos 3 caracteres.',
            'USUARIO_INVALIDO'
        );
    }

    if (typeof senha !== 'string' || senha.length < 4) {
        throw new AuthError(
            'A senha deve ter pelo menos 4 caracteres.',
            'SENHA_INVALIDA'
        );
    }

    const diretorio = path.dirname(arquivoUsuario);

    await fs.mkdir(diretorio, {
        recursive: true,
        mode: 0o700
    });

    await fs.chmod(diretorio, 0o700);

    const senhaHash = await bcrypt.hash(senha, 12);
    const conta = {
        usuario: usuario.trim(),
        senhaHash,
        versao: 1
    };

    let arquivo;

    try {
        arquivo = await fs.open(arquivoUsuario, 'wx', 0o600);
        await arquivo.writeFile(JSON.stringify(conta, null, 2) + '\n');
        await arquivo.sync();
        await arquivo.close();
        arquivo = null;

        await fs.chmod(arquivoUsuario, 0o600);

        return {
            usuario: conta.usuario,
            versao: conta.versao
        };
    } catch (erro) {
        if (arquivo) {
            await arquivo.close().catch(() => {});
            await fs.unlink(arquivoUsuario).catch(() => {});
        }

        if (erro.code === 'EEXIST') {
            throw new AuthError(
                'Já existe uma conta cadastrada. O cadastro inicial está bloqueado.',
                'CONTA_EXISTENTE'
            );
        }

        throw erro;
    }
}

async function alterarCredenciais({
    usuarioAtual,
    senhaAtual,
    novoUsuario,
    novaSenha
}) {
    const conta = await obterUsuario();

    if (!conta) {
        throw new AuthError('Conta não encontrada.', 'CONTA_INEXISTENTE');
    }

    if (typeof usuarioAtual !== 'string' || usuarioAtual !== conta.usuario) {
        throw new AuthError(
            'A conta foi alterada. Entre novamente.',
            'SESSAO_INVALIDA'
        );
    }

    const senhaAtualValida =
        typeof senhaAtual === 'string' &&
        await bcrypt.compare(senhaAtual, conta.senhaHash);

    if (!senhaAtualValida) {
        throw new AuthError('Senha atual incorreta.', 'SENHA_ATUAL_INCORRETA');
    }

    const usuarioInformado = typeof novoUsuario === 'string'
        ? novoUsuario.trim()
        : '';

    const senhaInformada = typeof novaSenha === 'string'
        ? novaSenha
        : '';

    if (!usuarioInformado && !senhaInformada) {
        throw new AuthError(
            'Informe um novo nome de usuário ou uma nova senha.',
            'NENHUMA_ALTERACAO'
        );
    }

    if (usuarioInformado && usuarioInformado.length < 3) {
        throw new AuthError(
            'O nome de usuário deve ter pelo menos 3 caracteres.',
            'USUARIO_INVALIDO'
        );
    }

    if (senhaInformada && senhaInformada.length < 4) {
        throw new AuthError(
            'A nova senha deve ter pelo menos 4 caracteres.',
            'SENHA_INVALIDA'
        );
    }

    const novaConta = {
        usuario: usuarioInformado || conta.usuario,
        senhaHash: senhaInformada
            ? await bcrypt.hash(senhaInformada, 12)
            : conta.senhaHash,
        versao: conta.versao + 1
    };

    const arquivoTemporario = `${arquivoUsuario}.${randomUUID()}.tmp`;

    try {
        await fs.writeFile(
            arquivoTemporario,
            JSON.stringify(novaConta, null, 2) + '\n',
            { mode: 0o600, flag: 'wx' }
        );

        await fs.chmod(arquivoTemporario, 0o600);
        await fs.rename(arquivoTemporario, arquivoUsuario);
        await fs.chmod(arquivoUsuario, 0o600);
        await fs.chmod(path.dirname(arquivoUsuario), 0o700);
    } catch (erro) {
        await fs.unlink(arquivoTemporario).catch(() => {});
        throw erro;
    }

    return {
        usuario: novaConta.usuario,
        versao: novaConta.versao
    };
}

module.exports = {
    obterUsuario,
    autenticar,
    criarUsuario,
    alterarCredenciais,
    AuthError
};
