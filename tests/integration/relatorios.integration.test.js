const request = require('supertest');

const app = require('../../server');
const agente = request.agent(app);
const con = require('../../src/config/database');
const pool = require('../../src/config/databasePool');

const db = con.promise();
const dbPool = pool.promise();

const cpfTeste = '11122233347';
const nomeClienteTeste = 'Cliente Integração Relatórios';

let idClienteTeste;
let idAgendamentoHoje;
let idAgendamentoDentroPeriodo;
let idAgendamentoLimite;
let idManutencaoTeste;
let idProdutoCloro;
let mesTeste;
let anoTeste;
let dataTeste;
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
        throw new Error(
            'Os testes devem utilizar somente manutencao_piscinas_test.'
        );
    }

    bancoConfirmado = true;

    // Obter o período e a data diretamente do banco de testes
    const [periodos] = await db.query(`
        SELECT
            YEAR(CURDATE()) AS ano,
            MONTH(CURDATE()) AS mes,
            DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS data
    `);

    anoTeste = periodos[0].ano;
    mesTeste = periodos[0].mes;
    dataTeste = periodos[0].data;

    // Localizar o produto sem alterar seu estoque
    const [produtos] = await db.execute(
        'SELECT idProduto FROM Produto WHERE tipo = ?',
        ['Cloro']
    );

    if (produtos.length !== 1) {
        throw new Error(
            'O banco de testes deve possuir exatamente um produto Cloro.'
        );
    }

    idProdutoCloro = produtos[0].idProduto;

    // Remover eventual registro de uma execução anterior
    await db.execute(
        'DELETE FROM Cliente WHERE cpf = ?',
        [cpfTeste]
    );

    const [cliente] = await db.execute(
        `INSERT INTO Cliente (nome, cpf, endereco, telefone, email)
         VALUES (?, ?, ?, ?, ?)`,
        [
            nomeClienteTeste,
            cpfTeste,
            'Rua Teste, 100',
            '67999999999',
            'relatorios@email.com'
        ]
    );

    idClienteTeste = cliente.insertId;

    // Criar agendamentos para testar os limites da agenda
    const [agendamentoHoje] = await db.execute(
        `INSERT INTO Agendamento (data, horario, idCliente)
         VALUES (CURDATE(), '05:00', ?)`,
        [idClienteTeste]
    );

    idAgendamentoHoje = agendamentoHoje.insertId;

    const [agendamentoDentro] = await db.execute(
        `INSERT INTO Agendamento (data, horario, idCliente)
         VALUES (DATE_ADD(CURDATE(), INTERVAL 29 DAY), '08:00', ?)`,
        [idClienteTeste]
    );

    idAgendamentoDentroPeriodo = agendamentoDentro.insertId;

    const [agendamentoLimite] = await db.execute(
        `INSERT INTO Agendamento (data, horario, idCliente)
         VALUES (DATE_ADD(CURDATE(), INTERVAL 30 DAY), '11:00', ?)`,
        [idClienteTeste]
    );

    idAgendamentoLimite = agendamentoLimite.insertId;

    // Criar manutenção vinculada ao agendamento de hoje
    const [manutencao] = await db.execute(
        `INSERT INTO Manutencao
            (data, ph, alcalinidade, cloro, idCliente, idAgendamento)
         VALUES
            (CURDATE(), 7.4, 80, 1.0, ?, ?)`,
        [idClienteTeste, idAgendamentoHoje]
    );

    idManutencaoTeste = manutencao.insertId;

    // Registrar consumo de cloro sem alterar o estoque do produto
    await db.execute(
        `INSERT INTO ItemManutencao
            (idManutencao, idProduto, quantidadeUtilizada)
         VALUES (?, ?, ?)`,
        [idManutencaoTeste, idProdutoCloro, 123]
    );
});

// Limpar somente os registros criados pelos testes
afterAll(async () => {
    try {
        if (bancoConfirmado && idClienteTeste) {
            // As relações do banco removem os registros dependentes
            await db.execute(
                'DELETE FROM Cliente WHERE idCliente = ?',
                [idClienteTeste]
            );
        }
    } finally {
        await dbPool.end();

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

// Listar períodos disponíveis
test('deve listar os períodos com manutenções cadastradas', async () => {
    const resposta = await agente
        .get('/relatorios/periodos');

    expect(resposta.status).toBe(200);
    expect(Array.isArray(resposta.body)).toBe(true);

    expect(
        resposta.body.some(
            periodo =>
                Number(periodo.ano) === Number(anoTeste) &&
                Number(periodo.mes) === Number(mesTeste)
        )
    ).toBe(true);
});

// Listar clientes disponíveis para o histórico
test('deve listar os clientes para seleção do histórico', async () => {
    const resposta = await agente
        .get('/relatorios/clientes');

    expect(resposta.status).toBe(200);
    expect(Array.isArray(resposta.body)).toBe(true);

    const cliente = resposta.body.find(
        item => Number(item.idCliente) === idClienteTeste
    );

    expect(cliente).toBeDefined();
    expect(cliente.nome).toBe(nomeClienteTeste);
});

// Emitir relatório mensal de manutenções
test('deve listar as manutenções do período selecionado', async () => {
    const resposta = await agente
        .get('/relatorios/manutencoes')
        .query({
            mes: mesTeste,
            ano: anoTeste
        });

    expect(resposta.status).toBe(200);
    expect(Array.isArray(resposta.body)).toBe(true);

    const manutencao = resposta.body.find(
        item => Number(item.idManutencao) === idManutencaoTeste
    );

    expect(manutencao).toBeDefined();
    expect(Number(manutencao.ph)).toBeCloseTo(7.4, 1);
    expect(Number(manutencao.alcalinidade)).toBe(80);
    expect(Number(manutencao.cloro)).toBe(1);
});

// Rejeitar período mensal inválido
test('não deve emitir relatório com mês ou ano inválido', async () => {
    const resposta = await agente
        .get('/relatorios/manutencoes')
        .query({
            mes: 13,
            ano: anoTeste
        });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toBe('Mês ou ano inválido.');
});

// Emitir relatório mensal de consumo
test('deve listar o consumo de produtos no período selecionado', async () => {
    const resposta = await agente
        .get('/relatorios/consumo')
        .query({
            mes: mesTeste,
            ano: anoTeste
        });

    expect(resposta.status).toBe(200);
    expect(Array.isArray(resposta.body)).toBe(true);

    const consumo = resposta.body.find(
        item => item.produto === 'Cloro'
    );

    expect(consumo).toBeDefined();
    expect(Number(consumo.quantidadeUtilizada)).toBe(123);
    expect(consumo.unidade).toBe('g');
});

// Emitir histórico de manutenção do cliente
test('deve listar o histórico de manutenções do cliente', async () => {
    const resposta = await agente
        .get(`/relatorios/clientes/${idClienteTeste}/historico`);

    expect(resposta.status).toBe(200);
    expect(Array.isArray(resposta.body)).toBe(true);

    const manutencao = resposta.body.find(
        item => Number(item.idManutencao) === idManutencaoTeste
    );

    expect(manutencao).toBeDefined();
    expect(Number(manutencao.ph)).toBeCloseTo(7.4, 1);
    expect(Number(manutencao.alcalinidade)).toBe(80);
    expect(Number(manutencao.cloro)).toBe(1);
    expect(manutencao.produto).toBe('Cloro');
    expect(Number(manutencao.quantidadeUtilizada)).toBe(123);
    expect(manutencao.unidade).toBe('g');
});

// Rejeitar ID de cliente inválido
test('não deve consultar histórico com ID de cliente inválido', async () => {
    const resposta = await agente
        .get('/relatorios/clientes/abc/historico');

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toBe('ID do cliente inválido.');
});

// Emitir agenda dos próximos 30 dias
test('deve listar agendamentos dentro dos próximos 30 dias', async () => {
    const resposta = await agente
        .get('/relatorios/agenda');

    expect(resposta.status).toBe(200);
    expect(Array.isArray(resposta.body)).toBe(true);

    const agendamentoHoje = resposta.body.find(
        item => Number(item.idAgendamento) === idAgendamentoHoje
    );

    const agendamentoDentro = resposta.body.find(
        item => Number(item.idAgendamento) === idAgendamentoDentroPeriodo
    );

    const agendamentoLimite = resposta.body.find(
        item => Number(item.idAgendamento) === idAgendamentoLimite
    );

    expect(agendamentoHoje).toBeDefined();
    expect(agendamentoDentro).toBeDefined();
    expect(agendamentoLimite).toBeUndefined();

    expect(agendamentoHoje.nomeCliente).toBe(nomeClienteTeste);
    expect(agendamentoHoje.data).toBe(dataTeste);
});
