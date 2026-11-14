const manutencaoRepository = require('../repositories/manutencaoRepository');

const MEDICOES_PERMITIDAS = {
    ph: [6.2, 7.0, 7.4, 7.8, 8.4],
    alcalinidade: [0, 20, 40, 80, 120, 180, 240],
    cloro: [0, 0.5, 1, 3, 5, 10]
};

const PRODUTOS = {
    cloro: 'Cloro',
    elevadorAlcalinidade: 'Elevador de alcalinidade',
    elevadorPh: 'Elevador de pH',
    redutor: 'Redutor de alcalinidade e pH'
};

// Validar identificador
function validarId(idAgendamento) {
    const id = Number(idAgendamento);

    if (!Number.isInteger(id) || id <= 0) {
        const erro = new Error('ID do agendamento inválido.');
        erro.statusCode = 400;
        throw erro;
    }

    return id;
}

// Validar medições conforme as opções dos medidores
function validarMedicoes(medicoes) {
    if (!medicoes || typeof medicoes !== 'object') {
        const erro = new Error('Informe as medições da piscina.');
        erro.statusCode = 400;
        throw erro;
    }

    const resultado = {};

    for (const [campo, valoresPermitidos] of Object.entries(MEDICOES_PERMITIDAS)) {
        const valor = Number(medicoes[campo]);

        if (
            medicoes[campo] === undefined ||
            medicoes[campo] === null ||
            medicoes[campo] === '' ||
            !valoresPermitidos.includes(valor)
        ) {
            const nomes = {
                ph: 'pH',
                alcalinidade: 'alcalinidade',
                cloro: 'cloro'
            };

            const erro = new Error(
                `Valor de ${nomes[campo]} inválido. Selecione uma das opções disponíveis no medidor.`
            );
            erro.statusCode = 400;
            throw erro;
        }

        resultado[campo] = valor;
    }

    return resultado;
}

// Obter a data atual no formato YYYY-MM-DD
function obterDataAtual() {
    const hoje = new Date();

    return [
        hoje.getFullYear(),
        String(hoje.getMonth() + 1).padStart(2, '0'),
        String(hoje.getDate()).padStart(2, '0')
    ].join('-');
}

// Validar se o agendamento pode receber uma manutenção
async function validarAgendamento(idAgendamento) {
    const dataAtual = obterDataAtual();
    const agendamentos =
        await manutencaoRepository.listarAgendamentosDisponiveis(dataAtual);

    const disponivel = agendamentos.some(
        agendamento =>
            Number(agendamento.idAgendamento) === idAgendamento
    );

    if (!disponivel) {
        const erro = new Error(
            'Agendamento não disponível para realizar manutenção.'
        );
        erro.statusCode = 400;
        throw erro;
    }

    const agendamento =
        await manutencaoRepository.buscarDadosAgendamento(idAgendamento);

    if (!agendamento) {
        const erro = new Error('Agendamento não encontrado.');
        erro.statusCode = 404;
        throw erro;
    }

    if (agendamento.data > dataAtual) {
        const erro = new Error(
            'Não é permitido realizar manutenção em agendamento futuro.'
        );
        erro.statusCode = 400;
        throw erro;
    }

    const profundidade = Number(agendamento.profundidade);
    const lado1 = Number(agendamento.lado1);
    const lado2 = Number(agendamento.lado2);

    if (
        !agendamento.idCliente ||
        !Number.isFinite(profundidade) ||
        !Number.isFinite(lado1) ||
        !Number.isFinite(lado2) ||
        profundidade <= 0 ||
        lado1 <= 0 ||
        lado2 <= 0
    ) {
        const erro = new Error(
            'O cliente não possui uma piscina com dimensões válidas.'
        );
        erro.statusCode = 400;
        throw erro;
    }

    return {
        ...agendamento,
        volume: profundidade * lado1 * lado2
    };
}

// Adicionar produto à lista de dosagens
function adicionarProduto(produtos, tipo, quantidade, unidade, intervalo) {
    if (quantidade <= 0) {
        return;
    }

    produtos.push({
        tipo,
        quantidadeUtilizada: Math.ceil(quantidade),
        unidade,
        intervalo
    });
}

// Calcular produtos e quantidades necessárias
function calcularDosagens(medicoes, volume) {
    const produtos = [];
    const orientacoes = [];

    const corrigirAlcalinidade =
        medicoes.alcalinidade < 80 ||
        medicoes.alcalinidade > 120;

    // Corrigir alcalinidade antes de avaliar o pH
    if (medicoes.alcalinidade < 80) {
        const diferenca = 80 - medicoes.alcalinidade;

        const quantidade = volume * (diferenca / 10) * 17;

        adicionarProduto(
            produtos,
            PRODUTOS.elevadorAlcalinidade,
            quantidade,
            'g',
            'Manter a filtração por 6 horas.'
        );

        orientacoes.push(
            'A quantidade de elevador de alcalinidade é estimada. Após a correção e a filtragem, o pH deverá ser avaliado antes de qualquer ajuste.'
        );
    } else if (medicoes.alcalinidade > 120) {
        const diferenca = medicoes.alcalinidade - 120;

        const quantidade = volume * (diferenca / 10) * 5;

        adicionarProduto(
            produtos,
            PRODUTOS.redutor,
            quantidade,
            'ml',
            'Manter a filtração por 6 horas.'
        );

        orientacoes.push(
            'A quantidade de redutor é estimada e foi calculada somente pela alcalinidade. Não será aplicada uma segunda dosagem baseada no pH nesta manutenção.'
        );

        orientacoes.push(
            'Após 6 horas de filtração, recomenda-se reavaliar o pH antes de realizar outro ajuste.'
        );
    } else {
        // Ajustar o pH somente quando a alcalinidade estiver ideal
        if (medicoes.ph < 7.0) {
            adicionarProduto(
                produtos,
                PRODUTOS.elevadorPh,
                volume * 20,
                'ml',
                'Manter a filtração por 2 horas.'
            );

            orientacoes.push(
                'A dosagem de elevador de pH é estimada e não garante o resultado final.'
            );
        } else if (medicoes.ph > 7.4 && medicoes.ph <= 8.0) {
            adicionarProduto(
                produtos,
                PRODUTOS.redutor,
                volume * 5,
                'ml',
                'Manter a filtração por 6 horas.'
            );

            orientacoes.push(
                'A dosagem de redutor de pH é estimada e não garante o resultado final.'
            );
        } else if (medicoes.ph > 8.0) {
            adicionarProduto(
                produtos,
                PRODUTOS.redutor,
                volume * 10,
                'ml',
                'Manter a filtração por 6 horas.'
            );

            orientacoes.push(
                'A dosagem de redutor de pH é estimada e não garante o resultado final.'
            );
        }
    }

    // Calcular cloro conforme a leitura do medidor
    if (medicoes.cloro < 1) {
        adicionarProduto(
            produtos,
            PRODUTOS.cloro,
            volume * 4,
            'g',
            'Aguardar 2 horas de filtração antes de liberar a piscina.'
        );

        orientacoes.push(
            'A quantidade de cloro é estimada. A orientação do fabricante recomenda verificar o teor de cloro antes de liberar a piscina.'
        );
    } else if (medicoes.cloro > 3) {
        orientacoes.push(
            'O teor de cloro está acima da faixa ideal. Não adicionar cloro nesta manutenção; manter a filtração e aguardar a redução do teor.'
        );
    }

    // Garantir a ordem de aplicação dos produtos
    produtos.sort((a, b) => {
        const prioridade = tipo => {
            if (
                tipo === PRODUTOS.elevadorAlcalinidade ||
                tipo === PRODUTOS.redutor && corrigirAlcalinidade
            ) {
                return 1;
            }

            if (tipo === PRODUTOS.cloro) {
                return 3;
            }

            return 2;
        };

        return prioridade(a.tipo) - prioridade(b.tipo);
    });

    // Identificar a ordem de aplicação
    produtos.forEach((produto, indice) => {
        produto.ordemAplicacao = indice + 1;
    });

    if (corrigirAlcalinidade) {
        orientacoes.unshift(
            'Sequência de aplicação: corrigir primeiro a alcalinidade e manter a filtração por 6 horas. Somente depois avaliar o pH.'
        );

        if (produtos.some(produto => produto.tipo === PRODUTOS.cloro)) {
            orientacoes.push(
                'Após concluir a etapa de correção da alcalinidade, aplicar o cloro por último e respeitar mais 2 horas de filtração antes de liberar a piscina.'
            );
        }
    }

    return {
        produtos,
        orientacoes
    };
}

// Listar agendamentos disponíveis
async function listarAgendamentosDisponiveis() {
    return await manutencaoRepository.listarAgendamentosDisponiveis(
        obterDataAtual()
    );
}

// Calcular a manutenção sem gravar no banco
async function calcular(idAgendamento, medicoesInformadas) {
    const id = validarId(idAgendamento);
    const medicoes = validarMedicoes(medicoesInformadas);

    const agendamento = await validarAgendamento(id);

    const resultado = calcularDosagens(
        medicoes,
        agendamento.volume
    );

    return {
        idAgendamento: id,
        data: agendamento.data,
        idCliente: agendamento.idCliente,
        nomeCliente: agendamento.nomeCliente,
        piscina: {
            profundidade: Number(agendamento.profundidade),
            lado1: Number(agendamento.lado1),
            lado2: Number(agendamento.lado2),
            volume: agendamento.volume
        },
        medicoes,
        produtos: resultado.produtos,
        orientacoes: resultado.orientacoes
    };
}

// Registrar a manutenção e atualizar o estoque
async function salvar(idAgendamento, medicoesInformadas) {
    const calculo = await calcular(idAgendamento, medicoesInformadas);

    const resultado = await manutencaoRepository.salvar({
        idAgendamento: calculo.idAgendamento,
        dataAtual: obterDataAtual(),
        medicoes: calculo.medicoes,
        produtos: calculo.produtos
    });

    return {
        ...resultado,
        calculo
    };
}

module.exports = {
    listarAgendamentosDisponiveis,
    calcular,
    salvar,
    validarMedicoes,
    calcularDosagens
};
