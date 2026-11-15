const request = require('supertest');

const app = require('../../server');
const con = require('../../src/config/database');

const db = con.promise();

const cpfTeste = '11122233344';
const dataTeste = '2099-12-30';
const dataNova = '2099-12-31';

let idClienteTeste;
let idAgendamentoTeste;
let idAgendamentoCriado;
let bancoConfirmado = false;

// Preparar os dados utilizados nos testes
beforeAll(async () => {
    const [bancos] = await db.query('SELECT DATABASE() AS nome');

    if (bancos[0].nome !== 'manutencao_piscinas_test') {
        throw new Error('Os testes devem utilizar somente manutencao_piscinas_test.');
    }

    bancoConfirmado = true;

    // Remover eventual registro de uma execução anterior
    await db.execute(
        'DELETE FROM Cliente WHERE cpf = ?',
        [cpfTeste]
    );

    const [cliente] = await db.execute(
        `INSERT INTO Cliente (nome, cpf, endereco, telefone, email)
         VALUES (?, ?, ?, ?, ?)`,
        [
            'Cliente Integração Agendamentos',
            cpfTeste,
            'Rua Teste, 100',
            '67999999999',
            'agendamentos@email.com'
        ]
    );

    idClienteTeste = cliente.insertId;

    // Criar um agendamento para testar listagem, busca e conflito
    const [agendamento] = await db.execute(
        `INSERT INTO Agendamento (data, horario, idCliente)
         VALUES (?, ?, ?)`,
        [dataTeste, '05:00', idClienteTeste]
    );

    idAgendamentoTeste = agendamento.insertId;
});

// Limpar somente os registros criados pelos testes
afterAll(async () => {
    try {
        if (bancoConfirmado && idClienteTeste) {
            await db.execute(
                'DELETE FROM Agendamento WHERE idCliente = ?',
                [idClienteTeste]
            );

            await db.execute(
                'DELETE FROM Cliente WHERE idCliente = ?',
                [idClienteTeste]
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

// Listar agendamentos
test('deve listar os agendamentos cadastrados', async () => {
    const resposta = await request(app)
        .get('/agendamentos/');

    expect(resposta.status).toBe(200);
    expect(Array.isArray(resposta.body)).toBe(true);

    const agendamento = resposta.body.find(
        item => item.idAgendamento === idAgendamentoTeste
    );

    expect(agendamento).toBeDefined();
    expect(agendamento.data).toBe(dataTeste);
    expect(agendamento.horario).toBe('05:00');
    expect(Number(agendamento.idCliente)).toBe(idClienteTeste);
});

// Buscar agendamento pelo ID
test('deve buscar um agendamento pelo ID', async () => {
    const resposta = await request(app)
        .get(`/agendamentos/${idAgendamentoTeste}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.idAgendamento).toBe(idAgendamentoTeste);
    expect(resposta.body.data).toBe(dataTeste);
    expect(resposta.body.horario).toBe('05:00');
    expect(resposta.body.nomeCliente).toBe(
        'Cliente Integração Agendamentos'
    );
});

// Rejeitar ID inválido na busca
test('não deve buscar agendamento com ID inválido', async () => {
    const resposta = await request(app)
        .get('/agendamentos/abc');

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toBe('ID do agendamento inválido.');
});

// Rejeitar agendamento inexistente na busca
test('deve retornar erro ao buscar agendamento inexistente', async () => {
    const resposta = await request(app)
        .get('/agendamentos/2147483647');

    expect(resposta.status).toBe(404);
    expect(resposta.body.erro).toBe('Agendamento não encontrado.');
});

// Cadastrar agendamento
test('deve cadastrar um novo agendamento', async () => {
    const resposta = await request(app)
        .post('/agendamentos/')
        .send({
            data: dataNova,
            horario: '08:00',
            idCliente: idClienteTeste
        });

    expect(resposta.status).toBe(200);
    expect(resposta.body.mensagem).toBe(
        'Agendamento cadastrado com sucesso.'
    );
    expect(resposta.body.idAgendamento).toBeDefined();

    idAgendamentoCriado = resposta.body.idAgendamento;

    const [agendamentos] = await db.execute(
        `SELECT data, TIME_FORMAT(horario, '%H:%i') AS horario, idCliente
         FROM Agendamento
         WHERE idAgendamento = ?`,
        [idAgendamentoCriado]
    );

    expect(agendamentos).toHaveLength(1);
    expect(agendamentos[0].data.toISOString().slice(0, 10)).toBe(dataNova);
    expect(agendamentos[0].horario).toBe('08:00');
    expect(agendamentos[0].idCliente).toBe(idClienteTeste);
});

// Atualizar agendamento
test('deve atualizar um agendamento existente', async () => {
    const resposta = await request(app)
        .post('/agendamentos/')
        .send({
            idAgendamento: idAgendamentoCriado,
            data: dataNova,
            horario: '11:00',
            idCliente: idClienteTeste
        });

    expect(resposta.status).toBe(200);
    expect(resposta.body.mensagem).toBe(
        'Agendamento atualizado com sucesso.'
    );
    expect(resposta.body.idAgendamento).toBe(idAgendamentoCriado);

    const [agendamentos] = await db.execute(
        `SELECT data, TIME_FORMAT(horario, '%H:%i') AS horario
         FROM Agendamento
         WHERE idAgendamento = ?`,
        [idAgendamentoCriado]
    );

    expect(agendamentos[0].data.toISOString().slice(0, 10)).toBe(dataNova);
    expect(agendamentos[0].horario).toBe('11:00');
});

// Rejeitar data inválida
test('não deve cadastrar agendamento com data inválida', async () => {
    const resposta = await request(app)
        .post('/agendamentos/')
        .send({
            data: '2099-02-30',
            horario: '08:00',
            idCliente: idClienteTeste
        });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toBe('Data inválida.');
});

// Rejeitar horário inválido
test('não deve cadastrar agendamento com horário inválido', async () => {
    const resposta = await request(app)
        .post('/agendamentos/')
        .send({
            data: dataNova,
            horario: '19:00',
            idCliente: idClienteTeste
        });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toBe(
        'Horário inválido. Selecione um dos horários disponíveis.'
    );
});

// Rejeitar horário ocupado
test('não deve cadastrar agendamento em horário já ocupado', async () => {
    const resposta = await request(app)
        .post('/agendamentos/')
        .send({
            data: dataTeste,
            horario: '05:00',
            idCliente: idClienteTeste
        });

    expect(resposta.status).toBe(409);
    expect(resposta.body.erro).toContain('Horário já ocupado');
    expect(resposta.body.erro).toContain(
        'Cliente Integração Agendamentos'
    );
});

// Rejeitar cliente inexistente
test('não deve cadastrar agendamento para cliente inexistente', async () => {
    const resposta = await request(app)
        .post('/agendamentos/')
        .send({
            data: dataNova,
            horario: '14:00',
            idCliente: 2147483647
        });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toBe('Cliente não encontrado.');
});

// Excluir agendamento
test('deve excluir um agendamento existente', async () => {
    const resposta = await request(app)
        .delete(`/agendamentos/${idAgendamentoCriado}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.mensagem).toBe(
        'Agendamento excluído com sucesso.'
    );

    const [agendamentos] = await db.execute(
        'SELECT idAgendamento FROM Agendamento WHERE idAgendamento = ?',
        [idAgendamentoCriado]
    );

    expect(agendamentos).toHaveLength(0);
});

// Rejeitar exclusão de agendamento inexistente
test('não deve excluir agendamento inexistente', async () => {
    const resposta = await request(app)
        .delete('/agendamentos/2147483647');

    expect(resposta.status).toBe(404);
    expect(resposta.body.erro).toBe('Agendamento não encontrado.');
});
