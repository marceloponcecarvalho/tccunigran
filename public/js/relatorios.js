const mensagem = document.getElementById('mensagem');
const filtroPeriodo = document.getElementById('filtroPeriodo');
const filtroCliente = document.getElementById('filtroCliente');
const selectPeriodo = document.getElementById('periodo');
const selectCliente = document.getElementById('idCliente');
const resultado = document.getElementById('resultado');
const tituloResultado = document.getElementById('tituloResultado');
const conteudoResultado = document.getElementById('conteudoResultado');

let tipoRelatorioAtual = null;
let periodosDisponiveis = [];

// Formatar data sem conversão de fuso horário
function formatarData(data) {
    if (!data) {
        return '';
    }

    return String(data).split('-').reverse().join('/');
}

// Formatar números para exibição
function formatarNumero(valor) {
    if (valor === null || valor === undefined || valor === '') {
        return '-';
    }

    return Number(valor).toLocaleString('pt-BR', {
        maximumFractionDigits: 2
    });
}

// Exibir mensagens
function exibirMensagem(texto, erro = false) {
    mensagem.textContent = texto;
    mensagem.style.color = erro ? 'red' : 'green';
}

// Consultar endpoint e tratar erros
async function consultarApi(url) {
    const resposta = await fetch(url);
    const dados = await resposta.json();

    if (!resposta.ok) {
        throw new Error(dados.erro || 'Erro ao consultar relatório.');
    }

    return dados;
}

// Criar tabela a partir de cabeçalhos e linhas
function criarTabela(cabecalhos, linhas) {
    const tabela = document.createElement('table');

    tabela.border = '1';
    tabela.cellPadding = '8';
    tabela.cellSpacing = '0';
    tabela.width = '100%';

    const thead = document.createElement('thead');
    const linhaCabecalho = document.createElement('tr');

    cabecalhos.forEach(texto => {
        const coluna = document.createElement('th');
        coluna.textContent = texto;
        linhaCabecalho.appendChild(coluna);
    });

    thead.appendChild(linhaCabecalho);
    tabela.appendChild(thead);

    const tbody = document.createElement('tbody');

    if (linhas.length === 0) {
        const linha = document.createElement('tr');
        const coluna = document.createElement('td');

        coluna.colSpan = cabecalhos.length;
        coluna.textContent = 'Nenhum registro encontrado.';

        linha.appendChild(coluna);
        tbody.appendChild(linha);
    } else {
        linhas.forEach(valores => {
            const linha = document.createElement('tr');

            valores.forEach(valor => {
                const coluna = document.createElement('td');
                coluna.textContent = valor ?? '-';
                linha.appendChild(coluna);
            });

            tbody.appendChild(linha);
        });
    }

    tabela.appendChild(tbody);

    return tabela;
}

// Exibir o resultado de um relatório
function exibirResultado(titulo, elemento) {
    tituloResultado.textContent = titulo;
    conteudoResultado.innerHTML = '';
    conteudoResultado.appendChild(elemento);

    resultado.hidden = false;
}

// Limpar a consulta anterior
function limparResultado() {
    resultado.hidden = true;
    tituloResultado.textContent = '';
    conteudoResultado.innerHTML = '';
}

// Selecionar tipo de relatório
function selecionarRelatorio(tipo) {
    tipoRelatorioAtual = tipo;

    filtroPeriodo.hidden =
        tipo !== 'manutencoes' && tipo !== 'consumo';

    filtroCliente.hidden = tipo !== 'historico';

    limparResultado();
    mensagem.textContent = '';

    if (tipo === 'agenda') {
        consultarAgenda();
    }
}

// Carregar períodos disponíveis
async function carregarPeriodos() {
    try {
        periodosDisponiveis = await consultarApi('/relatorios/periodos');

        selectPeriodo.innerHTML = '';

        if (periodosDisponiveis.length === 0) {
            selectPeriodo.innerHTML =
                '<option value="">Nenhum período disponível</option>';

            return;
        }

        periodosDisponiveis.forEach(periodo => {
            const opcao = document.createElement('option');

            const mes = String(periodo.mes).padStart(2, '0');

            opcao.value = `${mes}-${periodo.ano}`;
            opcao.textContent = `${mes}/${periodo.ano}`;

            selectPeriodo.appendChild(opcao);
        });

    } catch (erro) {
        exibirMensagem(erro.message, true);
    }
}

// Carregar clientes disponíveis
async function carregarClientes() {
    try {
        const clientes = await consultarApi('/relatorios/clientes');

        selectCliente.innerHTML =
            '<option value="">Selecione um cliente</option>';

        clientes.forEach(cliente => {
            const opcao = document.createElement('option');

            opcao.value = cliente.idCliente;
            opcao.textContent = cliente.nome;

            selectCliente.appendChild(opcao);
        });

        if (clientes.length === 0) {
            selectCliente.innerHTML =
                '<option value="">Nenhum cliente cadastrado</option>';
        }

    } catch (erro) {
        exibirMensagem(erro.message, true);
    }
}

// Consultar relatório mensal
async function consultarRelatorioMensal() {
    if (!selectPeriodo.value) {
        exibirMensagem('Selecione um período disponível.', true);
        return;
    }

    const [mes, ano] = selectPeriodo.value.split('-');

    const endpoint = tipoRelatorioAtual === 'manutencoes'
        ? '/relatorios/manutencoes'
        : '/relatorios/consumo';

    try {
        exibirMensagem('Consultando relatório...');

        const dados = await consultarApi(
            `${endpoint}?mes=${mes}&ano=${ano}`
        );

        if (tipoRelatorioAtual === 'manutencoes') {
            exibirRelatorioManutencoes(dados, mes, ano);
        } else {
            exibirRelatorioConsumo(dados, mes, ano);
        }

        exibirMensagem('Relatório consultado com sucesso.');

    } catch (erro) {
        limparResultado();
        exibirMensagem(erro.message, true);
    }
}

// Exibir relatório mensal de manutenções
function exibirRelatorioManutencoes(manutencoes, mes, ano) {
    const linhas = manutencoes.map(item => [
        formatarData(item.data),
        item.nomeCliente || 'Cliente não encontrado',
        formatarNumero(item.ph),
        formatarNumero(item.alcalinidade),
        formatarNumero(item.cloro)
    ]);

    const tabela = criarTabela(
        ['Data', 'Cliente', 'pH', 'Alcalinidade (ppm)', 'Cloro (ppm)'],
        linhas
    );

    exibirResultado(
        `Manutenções de ${mes}/${ano}`,
        tabela
    );
}

// Exibir relatório mensal de consumo
function exibirRelatorioConsumo(consumo, mes, ano) {
    const linhas = consumo.map(item => [
        item.produto,
        `${formatarNumero(item.quantidadeUtilizada)} ${item.unidade}`
    ]);

    const tabela = criarTabela(
        ['Produto', 'Quantidade utilizada'],
        linhas
    );

    exibirResultado(
        `Consumo de produtos em ${mes}/${ano}`,
        tabela
    );
}

// Consultar histórico de um cliente
async function consultarHistoricoCliente() {
    if (!selectCliente.value) {
        exibirMensagem('Selecione um cliente.', true);
        return;
    }

    try {
        exibirMensagem('Consultando histórico...');

        const clienteSelecionado =
            selectCliente.options[selectCliente.selectedIndex].textContent;

        const historico = await consultarApi(
            `/relatorios/clientes/${selectCliente.value}/historico`
        );

        exibirRelatorioHistorico(historico, clienteSelecionado);

        exibirMensagem('Histórico consultado com sucesso.');

    } catch (erro) {
        limparResultado();
        exibirMensagem(erro.message, true);
    }
}

// Exibir histórico agrupando os produtos por manutenção
function exibirRelatorioHistorico(historico, nomeCliente) {
    const manutencoes = new Map();

    historico.forEach(item => {
        if (!manutencoes.has(item.idManutencao)) {
            manutencoes.set(item.idManutencao, {
                data: item.data,
                ph: item.ph,
                alcalinidade: item.alcalinidade,
                cloro: item.cloro,
                produtos: []
            });
        }

        if (item.produto) {
            manutencoes.get(item.idManutencao).produtos.push(
                `${item.produto}: ${formatarNumero(item.quantidadeUtilizada)} ${item.unidade || ''}`.trim()
            );
        }
    });

    const linhas = Array.from(manutencoes.values()).map(item => [
        formatarData(item.data),
        formatarNumero(item.ph),
        formatarNumero(item.alcalinidade),
        formatarNumero(item.cloro),
        item.produtos.length > 0
            ? item.produtos.join('; ')
            : 'Nenhum produto registrado'
    ]);

    const tabela = criarTabela(
        [
            'Data',
            'pH',
            'Alcalinidade (ppm)',
            'Cloro (ppm)',
            'Produtos e quantidades utilizadas'
        ],
        linhas
    );

    exibirResultado(
        `Histórico de manutenções - ${nomeCliente}`,
        tabela
    );
}

// Consultar agenda dos próximos 30 dias
async function consultarAgenda() {
    try {
        exibirMensagem('Consultando agenda...');

        const agendamentos = await consultarApi('/relatorios/agenda');

        const linhas = agendamentos.map(item => [
            formatarData(item.data),
            item.horario,
            item.nomeCliente || 'Cliente não encontrado'
        ]);

        const tabela = criarTabela(
            ['Data', 'Horário', 'Cliente'],
            linhas
        );

        exibirResultado(
            'Agendamentos dos próximos 30 dias',
            tabela
        );

        exibirMensagem('Agenda consultada com sucesso.');

    } catch (erro) {
        limparResultado();
        exibirMensagem(erro.message, true);
    }
}

// Eventos dos botões
document.getElementById('btnManutencoes').addEventListener(
    'click',
    () => selecionarRelatorio('manutencoes')
);

document.getElementById('btnConsumo').addEventListener(
    'click',
    () => selecionarRelatorio('consumo')
);

document.getElementById('btnHistorico').addEventListener(
    'click',
    () => selecionarRelatorio('historico')
);

document.getElementById('btnAgenda').addEventListener(
    'click',
    () => selecionarRelatorio('agenda')
);

document.getElementById('btnConsultarPeriodo').addEventListener(
    'click',
    consultarRelatorioMensal
);

document.getElementById('btnConsultarHistorico').addEventListener(
    'click',
    consultarHistoricoCliente
);

// Inicialização
carregarPeriodos();
carregarClientes();
