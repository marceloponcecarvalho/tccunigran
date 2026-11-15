// Esse código define o banco de testes antes de os módulos da aplicação serem carregados.
process.env.MYSQL_DATABASE = 'manutencao_piscinas_test';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const bcrypt = require('bcrypt');

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'segredo-exclusivo-dos-testes';

const diretorioTeste = fs.mkdtempSync(
    path.join(os.tmpdir(), 'tccunigran-integracao-')
);

const diretorioSessoes = path.join(diretorioTeste, 'sessions');

fs.mkdirSync(diretorioSessoes, {
    recursive: true,
    mode: 0o700
});

process.env.AUTH_USER_FILE = path.join(diretorioTeste, 'usuario.json');
process.env.SESSION_FILE_STORE_PATH = diretorioSessoes;

fs.writeFileSync(
    process.env.AUTH_USER_FILE,
    JSON.stringify({
        usuario: 'usuario_teste',
        senhaHash: bcrypt.hashSync('SenhaTeste123', 4),
        versao: 1
    }),
    { mode: 0o600 }
);

afterAll(() => {
    fs.rmSync(diretorioTeste, {
        recursive: true,
        force: true
    });
});
