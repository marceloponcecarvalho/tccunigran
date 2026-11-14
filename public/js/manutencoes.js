const formManutencao = document.getElementById('formManutencao');
const selectAgendamento = document.getElementById('idAgendamento');
const listaAgendamentos = document.getElementById('listaAgendamentos');
const listaProdutos = document.getElementById('listaProdutos');
const listaOrientacoes = document.getElementById('listaOrientacoes');
const mensagem = document.getElementById('mensagem');
const resultado = document.getElementById('resultado');
const dadosPiscina = document.getElementById('dadosPiscina');
const btnCalcular = document.getElementById('btnCalcular');
const btnSalvar = document.getElementById('btnSalvar');

let calculoAtual = null;
let agendamentosDisponiveis = [];

// Formatar data sem conversão de fuso horário
function formatarData(data) {
    if (!data) {
        return '';
    }

    return data.split('-').reverse().join('/');
}

// Formatar números para exibição
function formatarNumero(valor) {
    return Number(valor).toLocaleString('pt-BR', {
        maximumFractionDigits: 2
    });
}

// Exibir mensagens
function exibirMensagem(texto, erro = false) {
    mensagem.textContent = texto;
    mensagem.style.color = erro ? 'red' : 'green';
}

// Limpar o resultado anterior
function limparResultado() {
    calculoAtual = null;

    resultado.hidden = true;
    listaProdutos.innerHTML = '';
    listaOrientacoes.innerHTML = '';

    btnSalvar.disabled = true;
}

// Invalidar cálculo quando os dados forem alterados
function invalidarCalculo() {
    limparResultado();
    mensagem.textContent = '';
}

// Carregar agendamentos disponíveis
async function carregarAgendamentos() {
    try {
        const resposta = await fetch('/manutencoes/agendamentos');

        const agendamentos = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                agendamentos.erro || 'Erro ao consultar agendamentos.'
            );
        }

        agendamentosDisponiveis = agendamentos;

        selectAgendamento.innerHTML =
            '<option value="">Selecione um agendamento</option>';

        listaAgendamentos.innerHTML = '';

        if (agendamentos.length === 0) {
            selectAgendamento.innerHTML =
                '<option value="">Nenhum agendamento disponível</option>';

            const linha = document.createElement('tr');
            const coluna = document.createElement('td');

            coluna.colSpan = 4;
            coluna.textContent =
                'Não existem agendamentos disponíveis para manutenção.';

            linha.appendChild(coluna);
            listaAgendamentos.appendChild(linha);

            return;
        }

        agendamentos.forEach(agendamento => {
            const opcao = document.createElement('option');

            opcao.value = agendamento.idAgendamento;
            opcao.textContent =
                `${formatarData(agendamento.data)} - ` +
                `${agendamento.horario} - ` +
                `${agendamento.nomeCliente}`;

            selectAgendamento.appendChild(opcao);

            const linha = document.createElement('tr');

            const valores = [
                formatarData(agendamento.data),
                agendamento.horario,
                agendamento.nomeCliente,
                formatarNumero(agendamento.volume)
            ];

            valores.forEach(valor => {
                const coluna = document.createElement('td');
                coluna.textContent = valor;
                linha.appendChild(coluna);
            });

            listaAgendamentos.appendChild(linha);
        });

    } catch (erro) {
        exibirMensagem(erro.message, true);
    }
}

// Montar os dados das medições
function obterDadosFormulario() {
    return {
        idAgendamento: Number(selectAgendamento.value),
        medicoes: {
            ph: Number(document.getElementById('ph').value),
            alcalinidade: Number(
                document.getElementById('alcalinidade').value
            ),
            cloro: Number(document.getElementById('cloro').value)
        }
    };
}

// Exibir dados da piscina e do agendamento
function exibirDadosPiscina(dados) {
    document.getElementById('nomeCliente').textContent =
        dados.nomeCliente;

    document.getElementById('dataAgendamento').textContent =
        formatarData(dados.data);

    const agendamento = agendamentosDisponiveis.find(item =>
        Number(item.idAgendamento) === Number(dados.idAgendamento)
    );

    document.getElementById('horarioAgendamento').textContent =
        agendamento ? agendamento.horario : '';

    document.getElementById('profundidade').textContent =
        formatarNumero(dados.piscina.profundidade);

    document.getElementById('lado1').textContent =
        formatarNumero(dados.piscina.lado1);

    document.getElementById('lado2').textContent =
        formatarNumero(dados.piscina.lado2);

    document.getElementById('volume').textContent =
        formatarNumero(dados.piscina.volume);

    dadosPiscina.hidden = false;
}

// Exibir produtos calculados
function exibirProdutos(produtos) {
    listaProdutos.innerHTML = '';

    if (produtos.length === 0) {
        const linha = document.createElement('tr');
        const coluna = document.createElement('td');

        coluna.colSpan = 4;
        coluna.textContent =
            'Nenhum produto necessário. As medições estão dentro das condições previstas.';

        linha.appendChild(coluna);
        listaProdutos.appendChild(linha);

        return;
    }

    produtos.forEach(produto => {
        const linha = document.createElement('tr');

        const valores = [
            produto.ordemAplicacao,
            produto.tipo,
            `${formatarNumero(produto.quantidadeUtilizada)} ${produto.unidade}`,
            produto.intervalo
        ];

        valores.forEach(valor => {
            const coluna = document.createElement('td');
            coluna.textContent = valor;
            linha.appendChild(coluna);
        });

        listaProdutos.appendChild(linha);
    });
}

// Exibir orientações de aplicação
function exibirOrientacoes(orientacoes) {
    listaOrientacoes.innerHTML = '';

    orientacoes.forEach(orientacao => {
        const item = document.createElement('li');
        item.textContent = orientacao;

        listaOrientacoes.appendChild(item);
    });
}

// Calcular dosagens sem salvar
async function calcularManutencao(evento) {
    evento.preventDefault();

    invalidarCalculo();

    if (!formManutencao.reportValidity()) {
        return;
    }

    btnCalcular.disabled = true;

    try {
        const dados = obterDadosFormulario();

        const resposta = await fetch('/manutencoes/calcular', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });

        const calculo = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                calculo.erro || 'Erro ao calcular a manutenção.'
            );
        }

        calculoAtual = dados;

        exibirDadosPiscina(calculo);
        exibirProdutos(calculo.produtos);
        exibirOrientacoes(calculo.orientacoes);

        resultado.hidden = false;
        btnSalvar.disabled = false;

        exibirMensagem('Dosagens calculadas. Confira os resultados antes de registrar.');

    } catch (erro) {
        exibirMensagem(erro.message, true);

    } finally {
        btnCalcular.disabled = false;
    }
}

// Exibir detalhes de falta de estoque
function exibirFaltasEstoque(detalhes) {
    if (!Array.isArray(detalhes) || detalhes.length === 0) {
        return;
    }

    const lista = document.createElement('ul');

    detalhes.forEach(item => {
        const linha = document.createElement('li');

        linha.textContent =
            `${item.tipo}: necessário ${formatarNumero(item.quantidadeNecessaria)} ${item.unidade}; ` +
            `disponível ${formatarNumero(item.quantidadeDisponivel)} ${item.unidade}; ` +
            `faltam ${formatarNumero(item.quantidadeFaltante)} ${item.unidade}.`;

        lista.appendChild(linha);
    });

    mensagem.appendChild(lista);
}

// Registrar manutenção
async function salvarManutencao() {
    if (!calculoAtual) {
        exibirMensagem('Calcule as dosagens antes de registrar a manutenção.', true);
        return;
    }

    btnSalvar.disabled = true;
    btnCalcular.disabled = true;

    try {
        const resposta = await fetch('/manutencoes/salvar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(calculoAtual)
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            exibirMensagem(dados.erro || 'Erro ao registrar a manutenção.', true);

            exibirFaltasEstoque(dados.detalhes);

            btnSalvar.disabled = false;
            return;
        }

        limparResultado();
        formManutencao.reset();
        dadosPiscina.hidden = true;

        exibirMensagem(
            `${dados.mensagem} Número do registro: ${dados.idManutencao}.`
        );

        await carregarAgendamentos();

    } catch (erro) {
        exibirMensagem(erro.message, true);
        btnSalvar.disabled = false;

    } finally {
        btnCalcular.disabled = false;
    }
}

// Limpar formulário
function limparFormulario() {
    formManutencao.reset();

    dadosPiscina.hidden = true;

    limparResultado();

    mensagem.textContent = '';
}

// Eventos
formManutencao.addEventListener('submit', calcularManutencao);

btnSalvar.addEventListener('click', salvarManutencao);

document.getElementById('btnLimpar').addEventListener(
    'click',
    limparFormulario
);

selectAgendamento.addEventListener('change', invalidarCalculo);

document.getElementById('ph').addEventListener('change', invalidarCalculo);

document.getElementById('alcalinidade').addEventListener(
    'change',
    invalidarCalculo
);

document.getElementById('cloro').addEventListener('change', invalidarCalculo);

// Inicialização
carregarAgendamentos();
