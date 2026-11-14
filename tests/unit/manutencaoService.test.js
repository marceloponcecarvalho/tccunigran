jest.mock('../../src/repositories/manutencaoRepository', () => ({
    listarAgendamentosDisponiveis: jest.fn(),
    buscarDadosAgendamento: jest.fn(),
    salvar: jest.fn()
}));

const manutencaoRepository = require('../../src/repositories/manutencaoRepository');
const manutencaoService = require('../../src/services/manutencaoService');

const agendamentoValido = {
    idAgendamento: 1,
    data: '2026-11-10',
    horario: '08:00',
    idCliente: 1,
    nomeCliente: 'Cliente Teste',
    profundidade: 1.5,
    lado1: 8,
    lado2: 4
};

const medicoesIdeais = {
    ph: 7.4,
    alcalinidade: 80,
    cloro: 1
};

beforeEach(() => {
    jest.clearAllMocks();

    manutencaoRepository.listarAgendamentosDisponiveis.mockResolvedValue([
        { idAgendamento: 1 }
    ]);

    manutencaoRepository.buscarDadosAgendamento.mockResolvedValue({
        ...agendamentoValido
    });

    manutencaoRepository.salvar.mockResolvedValue({
        idManutencao: 10,
        idAgendamento: 1,
        data: agendamentoValido.data,
        idCliente: 1
    });
});

describe('Validação do identificador do agendamento', () => {
    test.each([undefined, null, '', 0, -1, 1.5, 'abc'])(
        'deve rejeitar o identificador inválido: %s',
        async id => {
            await expect(
                manutencaoService.calcular(id, medicoesIdeais)
            ).rejects.toMatchObject({
                message: 'ID do agendamento inválido.',
                statusCode: 400
            });
        }
    );

    test('deve aceitar identificador numérico enviado como texto', async () => {
        const resultado = await manutencaoService.calcular(
            '1',
            medicoesIdeais
        );

        expect(resultado.idAgendamento).toBe(1);
    });
});

describe('Validação das medições', () => {
    test('deve exigir as medições', async () => {
        await expect(
            manutencaoService.calcular(1, null)
        ).rejects.toMatchObject({
            message: 'Informe as medições da piscina.',
            statusCode: 400
        });
    });

    test.each([
        ['ph', 6.8],
        ['ph', 9],
        ['alcalinidade', 60],
        ['alcalinidade', 300],
        ['cloro', 2],
        ['cloro', 8]
    ])('deve rejeitar %s fora das opções do medidor', async (campo, valor) => {
        const medicoes = {
            ...medicoesIdeais,
            [campo]: valor
        };

        await expect(
            manutencaoService.calcular(1, medicoes)
        ).rejects.toMatchObject({
            statusCode: 400
        });
    });

    test.each(['', null, undefined])(
        'deve rejeitar medição ausente ou vazia: %s',
        async valor => {
            const medicoes = {
                ...medicoesIdeais,
                ph: valor
            };

            await expect(
                manutencaoService.calcular(1, medicoes)
            ).rejects.toMatchObject({
                statusCode: 400
            });
        }
    );

    test('deve aceitar todas as opções válidas dos medidores', () => {
        const resultado = manutencaoService.validarMedicoes({
            ph: '7.0',
            alcalinidade: '120',
            cloro: '0.5'
        });

        expect(resultado).toEqual({
            ph: 7.0,
            alcalinidade: 120,
            cloro: 0.5
        });
    });
});

describe('Validação do agendamento e da piscina', () => {
    test('deve rejeitar agendamento não disponível', async () => {
        manutencaoRepository.listarAgendamentosDisponiveis.mockResolvedValue([]);

        await expect(
            manutencaoService.calcular(1, medicoesIdeais)
        ).rejects.toMatchObject({
            message: 'Agendamento não disponível para realizar manutenção.',
            statusCode: 400
        });

        expect(
            manutencaoRepository.buscarDadosAgendamento
        ).not.toHaveBeenCalled();
    });

    test('deve rejeitar agendamento inexistente', async () => {
        manutencaoRepository.buscarDadosAgendamento.mockResolvedValue(null);

        await expect(
            manutencaoService.calcular(1, medicoesIdeais)
        ).rejects.toMatchObject({
            message: 'Agendamento não encontrado.',
            statusCode: 404
        });
    });

    test('deve rejeitar agendamento futuro', async () => {
        const amanha = new Date();
        amanha.setDate(amanha.getDate() + 1);

        const dataFutura = [
            amanha.getFullYear(),
            String(amanha.getMonth() + 1).padStart(2, '0'),
            String(amanha.getDate()).padStart(2, '0')
        ].join('-');

        manutencaoRepository.buscarDadosAgendamento.mockResolvedValue({
            ...agendamentoValido,
            data: dataFutura
        });

        await expect(
            manutencaoService.calcular(1, medicoesIdeais)
        ).rejects.toMatchObject({
            message: 'Não é permitido realizar manutenção em agendamento futuro.',
            statusCode: 400
        });
    });

    test.each([
        { profundidade: 0 },
        { lado1: 0 },
        { lado2: -1 },
        { profundidade: null },
        { lado1: 'inválido' }
    ])('deve rejeitar dimensões inválidas da piscina: %o', async dimensoes => {
        manutencaoRepository.buscarDadosAgendamento.mockResolvedValue({
            ...agendamentoValido,
            ...dimensoes
        });

        await expect(
            manutencaoService.calcular(1, medicoesIdeais)
        ).rejects.toMatchObject({
            message: 'O cliente não possui uma piscina com dimensões válidas.',
            statusCode: 400
        });
    });

    test('deve calcular o volume usando profundidade média e lados da piscina', async () => {
        const resultado = await manutencaoService.calcular(
            1,
            medicoesIdeais
        );

        expect(resultado.piscina).toEqual({
            profundidade: 1.5,
            lado1: 8,
            lado2: 4,
            volume: 48
        });
    });
});

describe('Cálculo das dosagens', () => {
    test('não deve recomendar produtos quando todas as medições estiverem ideais', () => {
        const resultado = manutencaoService.calcularDosagens(
            medicoesIdeais,
            48
        );

        expect(resultado.produtos).toEqual([]);
        expect(resultado.orientacoes).toEqual([]);
    });

    test('deve corrigir alcalinidade baixa e não ajustar o pH na mesma aplicação', () => {
        const resultado = manutencaoService.calcularDosagens({
            ph: 6.2,
            alcalinidade: 40,
            cloro: 1
        }, 48);

        expect(resultado.produtos).toEqual([
            expect.objectContaining({
                tipo: 'Elevador de alcalinidade',
                quantidadeUtilizada: 3264,
                unidade: 'g',
                ordemAplicacao: 1
            })
        ]);

        expect(resultado.orientacoes.join(' ')).toContain(
            'Somente depois avaliar o pH.'
        );
    });

    test('deve corrigir alcalinidade alta sem somar uma segunda dosagem pelo pH', () => {
        const resultado = manutencaoService.calcularDosagens({
            ph: 8.4,
            alcalinidade: 240,
            cloro: 3
        }, 48);

        expect(resultado.produtos).toEqual([
            expect.objectContaining({
                tipo: 'Redutor de alcalinidade e pH',
                quantidadeUtilizada: 2880,
                unidade: 'ml',
                ordemAplicacao: 1
            })
        ]);

        expect(resultado.orientacoes.join(' ')).toContain(
            'calculada somente pela alcalinidade'
        );

        expect(resultado.orientacoes.join(' ')).toContain(
            'reavaliar o pH'
        );
    });

    test('deve corrigir pH baixo quando a alcalinidade estiver ideal', () => {
        const resultado = manutencaoService.calcularDosagens({
            ph: 6.2,
            alcalinidade: 120,
            cloro: 1
        }, 48);

        expect(resultado.produtos).toEqual([
            expect.objectContaining({
                tipo: 'Elevador de pH',
                quantidadeUtilizada: 960,
                unidade: 'ml',
                ordemAplicacao: 1
            })
        ]);
    });

    test('deve corrigir pH moderadamente alto quando a alcalinidade estiver ideal', () => {
        const resultado = manutencaoService.calcularDosagens({
            ph: 7.8,
            alcalinidade: 80,
            cloro: 1
        }, 48);

        expect(resultado.produtos).toEqual([
            expect.objectContaining({
                tipo: 'Redutor de alcalinidade e pH',
                quantidadeUtilizada: 240,
                unidade: 'ml'
            })
        ]);
    });

    test('deve aplicar dosagem maior de redutor para pH acima de 8.0', () => {
        const resultado = manutencaoService.calcularDosagens({
            ph: 8.4,
            alcalinidade: 80,
            cloro: 1
        }, 48);

        expect(resultado.produtos[0]).toEqual(
            expect.objectContaining({
                tipo: 'Redutor de alcalinidade e pH',
                quantidadeUtilizada: 480,
                unidade: 'ml'
            })
        );
    });

    test('deve adicionar cloro quando a leitura estiver abaixo do ideal', () => {
        const resultado = manutencaoService.calcularDosagens({
            ph: 7.4,
            alcalinidade: 80,
            cloro: 0.5
        }, 48);

        expect(resultado.produtos).toEqual([
            expect.objectContaining({
                tipo: 'Cloro',
                quantidadeUtilizada: 192,
                unidade: 'g',
                ordemAplicacao: 1
            })
        ]);
    });

    test('não deve adicionar cloro quando a leitura estiver acima do ideal', () => {
        const resultado = manutencaoService.calcularDosagens({
            ph: 7.4,
            alcalinidade: 80,
            cloro: 5
        }, 48);

        expect(resultado.produtos).toEqual([]);
        expect(resultado.orientacoes.join(' ')).toContain(
            'Não adicionar cloro'
        );
    });

    test('deve aplicar a correção de alcalinidade antes do cloro', () => {
        const resultado = manutencaoService.calcularDosagens({
            ph: 6.2,
            alcalinidade: 40,
            cloro: 0
        }, 48);

        expect(resultado.produtos.map(produto => produto.tipo)).toEqual([
            'Elevador de alcalinidade',
            'Cloro'
        ]);

        expect(resultado.produtos.map(produto => produto.ordemAplicacao)).toEqual([
            1,
            2
        ]);

        expect(resultado.orientacoes.join(' ')).toContain(
            'aplicar o cloro por último'
        );
    });
});

describe('Registro da manutenção', () => {
    test('deve calcular e enviar os dados ao repositório para salvar', async () => {
        const resultado = await manutencaoService.salvar(
            1,
            medicoesIdeais
        );

        expect(manutencaoRepository.salvar).toHaveBeenCalledWith({
            idAgendamento: 1,
            dataAtual: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
            medicoes: medicoesIdeais,
            produtos: []
        });

        expect(resultado.idManutencao).toBe(10);
        expect(resultado.calculo.idAgendamento).toBe(1);
    });

    test('não deve salvar quando as medições forem inválidas', async () => {
        await expect(
            manutencaoService.salvar(1, {
                ...medicoesIdeais,
                ph: 9
            })
        ).rejects.toMatchObject({
            statusCode: 400
        });

        expect(manutencaoRepository.salvar).not.toHaveBeenCalled();
    });
});
