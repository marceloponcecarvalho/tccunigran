
const formAgendamento = document.getElementById('formAgendamento');
const listaAgendamentos = document.getElementById('listaAgendamentos');
const selectCliente = document.getElementById('idCliente');
const mensagem = document.getElementById('mensagem');

// Exibir mensagens na tela
function exibirMensagem(texto, erro = false) {
    mensagem.textContent = texto;
    mensagem.style.color = erro ? 'red' : 'green';
}

// Limpar formulário
function limparFormulario() {
    formAgendamento.reset();
    document.getElementById('idAgendamento').value = '';
    mensagem.textContent = '';
}

// Calcular os limites da semana atual
function obterLimitesSemanaAtual() {
    const hoje = new Date();
    const inicioSemana = new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        hoje.getDate()
    );

    const diaSemana = inicioSemana.getDay();
    const diferenca = diaSemana === 0 ? -6 : 1 - diaSemana;

    inicioSemana.setDate(inicioSemana.getDate() + diferenca);

    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(fimSemana.getDate() + 7);

    function formatarData(data) {
        return [
            data.getFullYear(),
            String(data.getMonth() + 1).padStart(2, '0'),
            String(data.getDate()).padStart(2, '0')
        ].join('-');
    }

    return {
        inicio: formatarData(inicioSemana),
        fim: formatarData(fimSemana)
    };
}

// Carregar clientes cadastrados
async function carregarClientes() {
    try {
        const resposta = await fetch('/clientes/listar');

        if (!resposta.ok) {
            throw new Error('Erro ao consultar clientes.');
        }

        const clientes = await resposta.json();

        selectCliente.innerHTML = '<option value="">Selecione um cliente</option>';

        clientes.forEach(cliente => {
            const opcao = document.createElement('option');

            opcao.value = cliente.idCliente;
            opcao.textContent = cliente.nome;

            selectCliente.appendChild(opcao);
        });
    } catch (erro) {
        exibirMensagem(erro.message, true);
    }
}

// Carregar agendamentos cadastrados
async function carregarAgendamentos() {
    try {
        const resposta = await fetch('/agendamentos');

        if (!resposta.ok) {
            throw new Error('Erro ao consultar agendamentos.');
        }

        const agendamentos = await resposta.json();

        listaAgendamentos.innerHTML = '';

        const semanaAtual = obterLimitesSemanaAtual();

        agendamentos
            .filter(agendamento => agendamento.data >= semanaAtual.inicio)
            .forEach(agendamento => {
                const linha = document.createElement('tr');

                const data = agendamento.data.split('-').reverse().join('/');

                linha.innerHTML = `
                    <td>${data}</td>
                    <td>${agendamento.horario}</td>
                    <td></td>
                    <td></td>
                `;

                // Destacar os agendamentos da semana atual
                if (agendamento.data < semanaAtual.fim) {
                    linha.style.fontWeight = 'bold';
                }

                const colunaCliente = linha.children[2];
                colunaCliente.textContent = agendamento.nomeCliente || 'Cliente não encontrado';

                const colunaAcoes = linha.children[3];

                const botaoEditar = document.createElement('button');
                botaoEditar.textContent = 'Editar';
                botaoEditar.type = 'button';
                botaoEditar.addEventListener('click', () => editarAgendamento(agendamento));

                const botaoExcluir = document.createElement('button');
                botaoExcluir.textContent = 'Excluir';
                botaoExcluir.type = 'button';
                botaoExcluir.addEventListener('click', () => excluirAgendamento(agendamento.idAgendamento));

                colunaAcoes.appendChild(botaoEditar);
                colunaAcoes.appendChild(botaoExcluir);

                listaAgendamentos.appendChild(linha);
            });
    } catch (erro) {
        exibirMensagem(erro.message, true);
    }
}

// Preencher formulário para edição
function editarAgendamento(agendamento) {
    document.getElementById('idAgendamento').value = agendamento.idAgendamento;
    document.getElementById('idCliente').value = agendamento.idCliente;
    document.getElementById('data').value = agendamento.data;
    document.getElementById('horario').value = agendamento.horario;

    mensagem.textContent = '';

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Salvar ou atualizar agendamento
async function salvarAgendamento(evento) {
    evento.preventDefault();

    const dados = {
        idAgendamento: document.getElementById('idAgendamento').value,
        idCliente: selectCliente.value,
        data: document.getElementById('data').value,
        horario: document.getElementById('horario').value
    };

    try {
        const resposta = await fetch('/agendamentos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(resultado.erro || 'Erro ao salvar agendamento.');
        }

        limparFormulario();
        exibirMensagem(resultado.mensagem);
        await carregarAgendamentos();
    } catch (erro) {
        exibirMensagem(erro.message, true);
    }
}

// Excluir agendamento
async function excluirAgendamento(idAgendamento) {
    if (!confirm('Deseja realmente excluir este agendamento?')) {
        return;
    }

    try {
        const resposta = await fetch(`/agendamentos/${idAgendamento}`, {
            method: 'DELETE'
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(resultado.erro || 'Erro ao excluir agendamento.');
        }

        exibirMensagem(resultado.mensagem);

        await carregarAgendamentos();
    } catch (erro) {
        exibirMensagem(erro.message, true);
    }
}

// Eventos do formulário
formAgendamento.addEventListener('submit', salvarAgendamento);

document.getElementById('btnLimpar').addEventListener('click', limparFormulario);

// Inicialização
carregarClientes();
carregarAgendamentos();
