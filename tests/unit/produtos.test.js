const assert = require('node:assert/strict');

// Testes de conversão das apresentações comerciais
const apresentacoes = [
    { produto: 'Cloro', embalagem: '1 kg', quantidade: 1, esperado: 1000 },
    { produto: 'Cloro', embalagem: '10 kg', quantidade: 10, esperado: 10000 },
    { produto: 'Elevador de alcalinidade', embalagem: '1 kg', quantidade: 1, esperado: 1000 },
    { produto: 'Elevador de alcalinidade', embalagem: '2 kg', quantidade: 2, esperado: 2000 },
    { produto: 'Elevador de pH', embalagem: '1 L', quantidade: 1, esperado: 1000 },
    { produto: 'Elevador de pH', embalagem: '5 L', quantidade: 5, esperado: 5000 },
    { produto: 'Redutor de alcalinidade e pH', embalagem: '1 L', quantidade: 1, esperado: 1000 },
    { produto: 'Redutor de alcalinidade e pH', embalagem: '5 L', quantidade: 5, esperado: 5000 }
];

for (const apresentacao of apresentacoes) {
    test(`${apresentacao.produto}: ${apresentacao.embalagem} deve corresponder a ${apresentacao.esperado}`, () => {
        const quantidade = apresentacao.quantidade * 1000;

        assert.equal(quantidade, apresentacao.esperado);
    });
}

// Testes de acréscimo ao estoque
const atualizacoesEstoque = [
    { atual: 0, adicionado: 1000, esperado: 1000 },
    { atual: 4000, adicionado: 2000, esperado: 6000 },
    { atual: 18000, adicionado: 10000, esperado: 28000 },
    { atual: 5000, adicionado: 5000, esperado: 10000 }
];

for (const estoque of atualizacoesEstoque) {
    test(`Estoque: ${estoque.atual} + ${estoque.adicionado} deve resultar em ${estoque.esperado}`, () => {
        const novaQuantidade = estoque.atual + estoque.adicionado;

        assert.equal(novaQuantidade, estoque.esperado);
    });
}

// Testes de validação da quantidade de embalagens
const quantidadesInvalidas = [
    { valor: 0, descricao: 'zero' },
    { valor: -1, descricao: 'negativa' },
    { valor: '', descricao: 'vazia' },
    { valor: 1.5, descricao: 'decimal' }
];

for (const quantidade of quantidadesInvalidas) {
    test(`Quantidade ${quantidade.descricao} deve ser considerada inválida`, () => {
        const valor = quantidade.valor;

        const invalida =
            valor === "" ||
            !Number.isSafeInteger(Number(valor)) ||
            Number(valor) <= 0;

        assert.equal(invalida, true);
    });
}