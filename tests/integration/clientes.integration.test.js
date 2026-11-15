
const request = require('supertest');

const app = require('../../server');
const agente = request.agent(app);
const con = require('../../src/config/database');

const db = con.promise();

const cpfTeste = '12345678901';
const cpfNovo = '98765432100';

let idClienteTeste;
let bancoConfirmado = false;

// Preparar os dados utilizados nos testes
beforeAll(async () => {
    const login = await agente
        .post('/auth/login')
        .send({
            usuario: 'usuario_teste',
            senha: 'SenhaTeste123'
        });

    expect(login.status).toBe(200);

    const [bancos] = await db.query('SELECT DATABASE() AS nome');

    if (bancos[0].nome !== 'manutencao_piscinas_test') {
        throw new Error('Os testes devem utilizar somente manutencao_piscinas_test.');
    }

    bancoConfirmado = true;

    await db.execute(
        'DELETE FROM Cliente WHERE cpf IN (?, ?)',
        [cpfTeste, cpfNovo]
    );

    const [cliente] = await db.execute(
        `INSERT INTO Cliente (nome, cpf, endereco, telefone, email)
         VALUES (?, ?, ?, ?, ?)`,
        ['Cliente Integração', cpfTeste, 'Rua Teste, 100', '67999999999', 'teste@email.com']
    );

    idClienteTeste = cliente.insertId;

    await db.execute(
        `INSERT INTO Piscina (profundidade, lado1, lado2, idCliente)
         VALUES (?, ?, ?, ?)`,
        [1.5, 5, 4, idClienteTeste]
    );
});

// Limpar somente os registros criados pelos testes
afterAll(async () => {
    try {
        if (bancoConfirmado) {
            await db.execute(
                'DELETE FROM Cliente WHERE cpf IN (?, ?)',
                [cpfTeste, cpfNovo]
            );
        }
    } finally {
        await new Promise((resolve, reject) => {
            con.end(erro => {
                if (erro) return reject(erro);
                resolve();
            });
        });
    }
});

// Confirmar o banco utilizado
test('deve utilizar o banco de testes', async () => {
    const [bancos] = await db.query('SELECT DATABASE() AS nome');

    expect(bancos[0].nome).toBe('manutencao_piscinas_test');
});

// Consultar cliente pelo CPF
test('deve buscar cliente pelo CPF e retornar os dados da piscina', async () => {
    const resposta = await agente
        .get('/clientes/buscar')
        .query({ cpf: '123.456.789-01' });

    expect(resposta.status).toBe(200);
    expect(resposta.body.nome).toBe('Cliente Integração');
    expect(resposta.body.cpf).toBe(cpfTeste);
    expect(Number(resposta.body.profundidade)).toBe(1.5);
    expect(Number(resposta.body.lado1)).toBe(5);
    expect(Number(resposta.body.lado2)).toBe(4);
});

// Listar clientes
test('deve listar clientes e calcular o volume da piscina', async () => {
    const resposta = await agente
        .get('/clientes/listar');

    expect(resposta.status).toBe(200);

    const cliente = resposta.body.find(
        item => item.idCliente === idClienteTeste
    );

    expect(cliente).toBeDefined();
    expect(Number(cliente.volume)).toBe(30);
});

// Atualizar cliente e piscina
test('deve atualizar os dados do cliente e da piscina', async () => {
    const dados = {
        idCliente: idClienteTeste,
        nome: 'Cliente Atualizado',
        cpf: cpfTeste,
        endereco: 'Avenida Atualizada, 200',
        telefone: '67988888888',
        email: 'atualizado@email.com',
        profundidade: 2,
        lado1: 6,
        lado2: 5
    };

    const resposta = await agente
        .post('/clientes/salvar')
        .send(dados);

    expect(resposta.status).toBe(200);
    expect(resposta.body.sucesso).toBe(true);

    const [clientes] = await db.execute(
        'SELECT * FROM Cliente WHERE idCliente = ?',
        [idClienteTeste]
    );

    const [piscinas] = await db.execute(
        'SELECT * FROM Piscina WHERE idCliente = ?',
        [idClienteTeste]
    );

    expect(clientes[0].nome).toBe('Cliente Atualizado');
    expect(clientes[0].endereco).toBe('Avenida Atualizada, 200');
    expect(piscinas).toHaveLength(1);
    expect(Number(piscinas[0].profundidade)).toBe(2);
    expect(Number(piscinas[0].lado1)).toBe(6);
    expect(Number(piscinas[0].lado2)).toBe(5);
});

// Cadastrar novo cliente
test('deve cadastrar cliente e piscina no banco de dados', async () => {
    const dados = {
        nome: 'Novo Cliente',
        cpf: cpfNovo,
        endereco: 'Rua Nova, 300',
        telefone: '67977777777',
        email: 'novo@email.com',
        profundidade: 1.2,
        lado1: 4,
        lado2: 3
    };

    const resposta = await agente
        .post('/clientes/salvar')
        .send(dados);

    expect(resposta.status).toBe(200);
    expect(resposta.body.sucesso).toBe(true);
    expect(resposta.body.idCliente).toBeDefined();

    const [clientes] = await db.execute(
        'SELECT * FROM Cliente WHERE cpf = ?',
        [cpfNovo]
    );

    const [piscinas] = await db.execute(
        'SELECT * FROM Piscina WHERE idCliente = ?',
        [resposta.body.idCliente]
    );

    expect(clientes).toHaveLength(1);
    expect(clientes[0].nome).toBe('Novo Cliente');
    expect(piscinas).toHaveLength(1);
    expect(Number(piscinas[0].profundidade)).toBeCloseTo(1.2, 5);
});

// Rejeitar CPF inválido
test('não deve cadastrar cliente com CPF inválido', async () => {
    const resposta = await agente
        .post('/clientes/salvar')
        .send({
            nome: 'Cliente Inválido',
            cpf: '123',
            endereco: 'Rua Teste',
            profundidade: 1,
            lado1: 4,
            lado2: 3
        });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toContain('CPF/CNPJ inválido');

    const [clientes] = await db.execute(
        'SELECT * FROM Cliente WHERE cpf = ?',
        ['123']
    );

    expect(clientes).toHaveLength(0);
});

// Rejeitar CPF duplicado
test('não deve cadastrar dois clientes com o mesmo CPF', async () => {
    const resposta = await agente
        .post('/clientes/salvar')
        .send({
            nome: 'Cliente Duplicado',
            cpf: cpfTeste,
            endereco: 'Rua Duplicada',
            telefone: '67966666666',
            email: 'duplicado@email.com',
            profundidade: 1,
            lado1: 4,
            lado2: 3
        });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toBe('CPF/CNPJ já cadastrado.');

    const [clientes] = await db.execute(
        'SELECT * FROM Cliente WHERE cpf = ?',
        [cpfTeste]
    );

    expect(clientes).toHaveLength(1);
});
