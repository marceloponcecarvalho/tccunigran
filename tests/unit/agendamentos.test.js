
const { JSDOM } = require('jsdom');
const fs = require('node:fs');
const path = require('node:path');

const codigo = fs.readFileSync(
    path.join(__dirname, '../../public/js/agendamentos.js'),
    'utf8'
);

let dom;
let window;
let document;

function resposta(dados, ok = true) {
    return {
        ok,
        json: async () => dados
    };
}

function adicionarDias(data, quantidade) {
    const resultado = new Date(`${data}T00:00:00Z`);

    resultado.setUTCDate(resultado.getUTCDate() + quantidade);

    return resultado.toISOString().slice(0, 10);
}

async function prepararAmbiente() {
    dom = new JSDOM(`
        <!DOCTYPE html>
        <html>
        <body>
            <form id="formAgendamento">
                <input type="hidden" id="idAgendamento">
                <select id="idCliente">
                    <option value="">Selecione um cliente</option>
                </select>
                <input type="date" id="data">
                <select id="horario">
                    <option value="">Selecione um horário</option>
                    <option value="05:00">05:00</option>
                    <option value="08:00">08:00</option>
                    <option value="11:00">11:00</option>
                    <option value="14:00">14:00</option>
                    <option value="17:00">17:00</option>
                </select>
                <button type="submit">Salvar</button>
            </form>
            <button type="button" id="btnLimpar">Limpar</button>
            <div id="mensagem"></div>
            <table>
                <tbody id="listaAgendamentos"></tbody>
            </table>
        </body>
        </html>
    `, {
        runScripts: 'outside-only',
        pretendToBeVisual: true
    });

    window = dom.window;
    document = window.document;

    window.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve(resposta([]))
    );

    window.confirm = jest.fn(() => true);
    window.scrollTo = jest.fn();

    window.eval(codigo);

    // Aguarda as chamadas iniciais de carregamento.
    await new Promise(resolve => setTimeout(resolve, 0));

    window.fetch.mockClear();
}

afterEach(() => {
    if (dom) {
        dom.window.close();
    }
});

describe('Frontend de agendamentos', () => {
    test('deve carregar os clientes cadastrados', async () => {
        await prepararAmbiente();

        window.fetch.mockResolvedValueOnce(resposta([
            { idCliente: 1, nome: 'João Silva' },
            { idCliente: 2, nome: 'Maria Souza' }
        ]));

        await window.carregarClientes();

        const opcoes = document.querySelectorAll('#idCliente option');

        expect(opcoes).toHaveLength(3);
        expect(opcoes[1].value).toBe('1');
        expect(opcoes[1].textContent).toBe('João Silva');
        expect(opcoes[2].value).toBe('2');
        expect(opcoes[2].textContent).toBe('Maria Souza');
    });

    test('deve listar os agendamentos cadastrados', async () => {
        await prepararAmbiente();

        window.fetch.mockResolvedValueOnce(resposta([
            {
                idAgendamento: 1,
                data: '2026-11-20',
                horario: '08:00',
                idCliente: 1,
                nomeCliente: 'João Silva'
            }
        ]));

        await window.carregarAgendamentos();

        const linha = document.querySelector('#listaAgendamentos tr');

        expect(linha).not.toBeNull();
        expect(linha.children[0].textContent).toBe('20/11/2026');
        expect(linha.children[1].textContent).toBe('08:00');
        expect(linha.children[2].textContent).toBe('João Silva');
        expect(linha.children[3].children).toHaveLength(2);
    });
    
    test('não deve exibir agendamentos anteriores à semana atual', async () => {
        await prepararAmbiente();

        const semana = window.obterLimitesSemanaAtual();

        window.fetch.mockResolvedValueOnce(resposta([
            {
                idAgendamento: 1,
                data: adicionarDias(semana.inicio, -1),
                horario: '08:00',
                idCliente: 1,
                nomeCliente: 'Cliente Antigo'
            },
            {
                idAgendamento: 2,
                data: semana.inicio,
                horario: '11:00',
                idCliente: 1,
                nomeCliente: 'Cliente Atual'
            }
        ]));

        await window.carregarAgendamentos();

        const linhas = document.querySelectorAll('#listaAgendamentos tr');

        expect(linhas).toHaveLength(1);
        expect(linhas[0].children[2].textContent).toBe('Cliente Atual');
    });

    test('deve destacar os agendamentos da semana atual em negrito', async () => {
        await prepararAmbiente();

        const semana = window.obterLimitesSemanaAtual();

        window.fetch.mockResolvedValueOnce(resposta([
            {
                idAgendamento: 1,
                data: semana.inicio,
                horario: '08:00',
                idCliente: 1,
                nomeCliente: 'Cliente Segunda'
            },
            {
                idAgendamento: 2,
                data: adicionarDias(semana.fim, -1),
                horario: '11:00',
                idCliente: 1,
                nomeCliente: 'Cliente Domingo'
            },
            {
                idAgendamento: 3,
                data: semana.fim,
                horario: '14:00',
                idCliente: 1,
                nomeCliente: 'Cliente Próxima Semana'
            }
        ]));

        await window.carregarAgendamentos();

        const linhas = document.querySelectorAll('#listaAgendamentos tr');

        expect(linhas).toHaveLength(3);
        expect(linhas[0].style.fontWeight).toBe('bold');
        expect(linhas[1].style.fontWeight).toBe('bold');
        expect(linhas[2].style.fontWeight).toBe('');
    });

    test('deve preencher o formulário ao editar um agendamento', async () => {
        await prepararAmbiente();

        document.getElementById('idCliente').innerHTML +=
            '<option value="1">João Silva</option>';

        const agendamento = {
            idAgendamento: 5,
            idCliente: 1,
            data: '2026-11-20',
            horario: '11:00'
        };

        window.editarAgendamento(agendamento);

        expect(document.getElementById('idAgendamento').value).toBe('5');
        expect(document.getElementById('idCliente').value).toBe('1');
        expect(document.getElementById('data').value).toBe('2026-11-20');
        expect(document.getElementById('horario').value).toBe('11:00');
        expect(window.scrollTo).toHaveBeenCalled();
    });

    test('deve limpar os campos do formulário', async () => {
        await prepararAmbiente();

        document.getElementById('idAgendamento').value = '5';
        document.getElementById('data').value = '2026-11-20';
        document.getElementById('mensagem').textContent = 'Mensagem anterior';

        window.limparFormulario();

        expect(document.getElementById('idAgendamento').value).toBe('');
        expect(document.getElementById('data').value).toBe('');
        expect(document.getElementById('mensagem').textContent).toBe('');
    });

    test('deve cadastrar um novo agendamento', async () => {
        await prepararAmbiente();

        document.getElementById('idCliente').innerHTML +=
            '<option value="1">João Silva</option>';

        document.getElementById('idCliente').value = '1';
        document.getElementById('data').value = '2026-11-20';
        document.getElementById('horario').value = '08:00';

        window.fetch
            .mockResolvedValueOnce(resposta({ mensagem: 'Agendamento salvo com sucesso.' }))
            .mockResolvedValueOnce(resposta([]));

        const evento = { preventDefault: jest.fn() };

        await window.salvarAgendamento(evento);

        expect(evento.preventDefault).toHaveBeenCalled();

        expect(window.fetch).toHaveBeenNthCalledWith(
            1,
            '/agendamentos',
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    idAgendamento: '',
                    idCliente: '1',
                    data: '2026-11-20',
                    horario: '08:00'
                })
            })
        );

        expect(document.getElementById('mensagem').textContent)
            .toBe('Agendamento salvo com sucesso.');
    });

    test('deve exibir erro quando não conseguir salvar', async () => {
        await prepararAmbiente();

        window.fetch.mockResolvedValueOnce(
            resposta({ erro: 'Horário já ocupado pelo cliente João Silva.' }, false)
        );

        await window.salvarAgendamento({
            preventDefault: jest.fn()
        });

        const mensagem = document.getElementById('mensagem');

        expect(mensagem.textContent)
            .toBe('Horário já ocupado pelo cliente João Silva.');
        expect(mensagem.style.color).toBe('red');
    });

    test('deve excluir um agendamento após confirmação', async () => {
        await prepararAmbiente();

        window.fetch
            .mockResolvedValueOnce(resposta({ mensagem: 'Agendamento excluído com sucesso.' }))
            .mockResolvedValueOnce(resposta([]));

        await window.excluirAgendamento(5);

        expect(window.confirm).toHaveBeenCalledWith(
            'Deseja realmente excluir este agendamento?'
        );

        expect(window.fetch).toHaveBeenNthCalledWith(
            1,
            '/agendamentos/5',
            { method: 'DELETE' }
        );
    });

    test('não deve excluir quando o usuário cancelar a confirmação', async () => {
        await prepararAmbiente();

        window.confirm.mockReturnValueOnce(false);

        await window.excluirAgendamento(5);

        expect(window.fetch).not.toHaveBeenCalled();
    });

    test('deve exibir erro quando não conseguir carregar clientes', async () => {
        await prepararAmbiente();

        window.fetch.mockRejectedValueOnce(
            new Error('Erro ao consultar clientes.')
        );

        await window.carregarClientes();

        const mensagem = document.getElementById('mensagem');

        expect(mensagem.textContent).toBe('Erro ao consultar clientes.');
        expect(mensagem.style.color).toBe('red');
    });
});
