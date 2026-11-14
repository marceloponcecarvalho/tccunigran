const assert = require('node:assert/strict');

jest.mock('../../src/services/agendamentosService', () => ({
    listar: jest.fn(),
    buscarPorId: jest.fn(),
    salvar: jest.fn(),
    excluir: jest.fn()
}));

const agendamentosService = require('../../src/services/agendamentosService');
const agendamentosController = require('../../src/controllers/agendamentosController');

const agendamento = {
    idAgendamento: 1,
    data: '2026-11-15',
    horario: '08:00',
    idCliente: 2,
    nomeCliente: 'Cliente Teste'
};

// Simular os objetos de requisição e resposta do Express
function criarResposta() {
    const res = {};

    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);

    return res;
}

beforeEach(() => {
    jest.clearAllMocks();
});

// Listar agendamentos
test('listar deve retornar os agendamentos com status 200', async () => {
    agendamentosService.listar.mockResolvedValueOnce([agendamento]);

    const res = criarResposta();

    await agendamentosController.listar({}, res);

    assert.equal(res.status.mock.calls[0][0], 200);
    assert.deepEqual(res.json.mock.calls[0][0], [agendamento]);
});

test('listar deve retornar status 500 quando ocorrer erro', async () => {
    agendamentosService.listar.mockRejectedValueOnce(
        new Error('Erro no banco')
    );

    const res = criarResposta();

    await agendamentosController.listar({}, res);

    assert.equal(res.status.mock.calls[0][0], 500);
    assert.deepEqual(res.json.mock.calls[0][0], {
        erro: 'Erro ao consultar os agendamentos.'
    });
});

// Buscar agendamento pelo ID
test('buscarPorId deve retornar o agendamento com status 200', async () => {
    agendamentosService.buscarPorId.mockResolvedValueOnce(agendamento);

    const req = {
        params: { id: '1' }
    };

    const res = criarResposta();

    await agendamentosController.buscarPorId(req, res);

    assert.equal(agendamentosService.buscarPorId.mock.calls[0][0], '1');
    assert.equal(res.status.mock.calls[0][0], 200);
    assert.deepEqual(res.json.mock.calls[0][0], agendamento);
});

test('buscarPorId deve retornar status 404 quando não encontrar o agendamento', async () => {
    agendamentosService.buscarPorId.mockRejectedValueOnce(
        new Error('Agendamento não encontrado.')
    );

    const req = {
        params: { id: '999' }
    };

    const res = criarResposta();

    await agendamentosController.buscarPorId(req, res);

    assert.equal(res.status.mock.calls[0][0], 404);
});

test('buscarPorId deve retornar status 400 para ID inválido', async () => {
    agendamentosService.buscarPorId.mockRejectedValueOnce(
        new Error('ID do agendamento inválido.')
    );

    const req = {
        params: { id: 'abc' }
    };

    const res = criarResposta();

    await agendamentosController.buscarPorId(req, res);

    assert.equal(res.status.mock.calls[0][0], 400);
});

test('buscarPorId deve retornar status 500 para erro inesperado', async () => {
    agendamentosService.buscarPorId.mockRejectedValueOnce(
        new Error('Erro no banco')
    );

    const req = {
        params: { id: '1' }
    };

    const res = criarResposta();

    await agendamentosController.buscarPorId(req, res);

    assert.equal(res.status.mock.calls[0][0], 500);
});

// Salvar agendamento
test('salvar deve cadastrar agendamento com status 200', async () => {
    agendamentosService.salvar.mockResolvedValueOnce(10);

    const req = {
        body: {
            data: '2026-11-15',
            horario: '08:00',
            idCliente: 2
        }
    };

    const res = criarResposta();

    await agendamentosController.salvar(req, res);

    assert.equal(res.status.mock.calls[0][0], 200);
    assert.deepEqual(res.json.mock.calls[0][0], {
        mensagem: 'Agendamento cadastrado com sucesso.',
        idAgendamento: 10
    });
});

test('salvar deve atualizar agendamento existente', async () => {
    agendamentosService.salvar.mockResolvedValueOnce(5);

    const req = {
        body: {
            idAgendamento: 5,
            data: '2026-11-16',
            horario: '11:00',
            idCliente: 2
        }
    };

    const res = criarResposta();

    await agendamentosController.salvar(req, res);

    assert.equal(res.status.mock.calls[0][0], 200);
    assert.deepEqual(res.json.mock.calls[0][0], {
        mensagem: 'Agendamento atualizado com sucesso.',
        idAgendamento: 5
    });
});

test('salvar deve retornar status 409 quando o horário estiver ocupado', async () => {
    agendamentosService.salvar.mockRejectedValueOnce(
        new Error('Horário já ocupado pelo cliente Cliente Teste.')
    );

    const req = {
        body: {
            data: '2026-11-15',
            horario: '08:00',
            idCliente: 2
        }
    };

    const res = criarResposta();

    await agendamentosController.salvar(req, res);

    assert.equal(res.status.mock.calls[0][0], 409);
});

test('salvar deve retornar status 400 para dados inválidos', async () => {
    agendamentosService.salvar.mockRejectedValueOnce(
        new Error('Horário inválido. Selecione um dos horários disponíveis.')
    );

    const req = {
        body: {
            data: '2026-11-15',
            horario: '19:00',
            idCliente: 2
        }
    };

    const res = criarResposta();

    await agendamentosController.salvar(req, res);

    assert.equal(res.status.mock.calls[0][0], 400);
});

test('salvar deve retornar status 400 para data anterior à atual', async () => {
    const mensagem = 'Não é permitido agendar em uma data anterior à atual.';

    agendamentosService.salvar.mockRejectedValueOnce(
        new Error(mensagem)
    );

    const req = {
        body: {
            data: '2026-11-12',
            horario: '08:00',
            idCliente: 2
        }
    };

    const res = criarResposta();

    await agendamentosController.salvar(req, res);

    assert.equal(res.status.mock.calls[0][0], 400);
    assert.deepEqual(res.json.mock.calls[0][0], {
        erro: mensagem
    });
});

test('salvar deve retornar status 404 quando o agendamento não existir', async () => {
    agendamentosService.salvar.mockRejectedValueOnce(
        new Error('Agendamento não encontrado.')
    );

    const req = {
        body: {
            idAgendamento: 999,
            data: '2026-11-15',
            horario: '08:00',
            idCliente: 2
        }
    };

    const res = criarResposta();

    await agendamentosController.salvar(req, res);

    assert.equal(res.status.mock.calls[0][0], 404);
});

test('salvar deve retornar status 500 para erro inesperado', async () => {
    agendamentosService.salvar.mockRejectedValueOnce(
        new Error('Erro no banco')
    );

    const req = {
        body: {
            data: '2026-11-15',
            horario: '08:00',
            idCliente: 2
        }
    };

    const res = criarResposta();

    await agendamentosController.salvar(req, res);

    assert.equal(res.status.mock.calls[0][0], 500);
});

// Excluir agendamento
test('excluir deve remover agendamento com status 200', async () => {
    agendamentosService.excluir.mockResolvedValueOnce(true);

    const req = {
        params: { id: '5' }
    };

    const res = criarResposta();

    await agendamentosController.excluir(req, res);

    assert.equal(agendamentosService.excluir.mock.calls[0][0], '5');
    assert.equal(res.status.mock.calls[0][0], 200);
    assert.deepEqual(res.json.mock.calls[0][0], {
        mensagem: 'Agendamento excluído com sucesso.'
    });
});

test('excluir deve retornar status 404 quando o agendamento não existir', async () => {
    agendamentosService.excluir.mockRejectedValueOnce(
        new Error('Agendamento não encontrado.')
    );

    const req = {
        params: { id: '999' }
    };

    const res = criarResposta();

    await agendamentosController.excluir(req, res);

    assert.equal(res.status.mock.calls[0][0], 404);
});

test('excluir deve retornar status 400 para ID inválido', async () => {
    agendamentosService.excluir.mockRejectedValueOnce(
        new Error('ID do agendamento inválido.')
    );

    const req = {
        params: { id: 'abc' }
    };

    const res = criarResposta();

    await agendamentosController.excluir(req, res);

    assert.equal(res.status.mock.calls[0][0], 400);
});

test('excluir deve retornar status 500 para erro inesperado', async () => {
    agendamentosService.excluir.mockRejectedValueOnce(
        new Error('Erro no banco')
    );

    const req = {
        params: { id: '5' }
    };

    const res = criarResposta();

    await agendamentosController.excluir(req, res);

    assert.equal(res.status.mock.calls[0][0], 500);
});
