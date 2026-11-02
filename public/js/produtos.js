// Esta tabela tem os tipos de embalagens dos produtos que podem ser compradas
const configuracaoProdutos = {
    "Cloro": {
        unidade: "g",
        embalagens: {
            "1000": "1 kg",
            "10000": "10 kg"
        }
    },
    "Elevador de alcalinidade": {
        unidade: "g",
        embalagens: {
            "1000": "1 kg",
            "2000": "2 kg"
        }
    },
    "Elevador de pH": {
        unidade: "ml",
        embalagens: {
            "1000": "1 L",
            "5000": "5 L"
        }
    },
    "Redutor de alcalinidade e pH": {
        unidade: "ml",
        embalagens: {
            "1000": "1 L",
            "5000": "5 L"
        }
    }
};

// Limpar o formulario
function limparFormulario() {
    const form = document.getElementById("formProduto");

    form.reset();
    document.getElementById("idProduto").value = "";
    document.getElementById("quantidadeAtual").value = "";
    document.getElementById("quantidadeAtual").dataset.quantidade = "";

    const embalagem = document.getElementById("embalagem");
    embalagem.innerHTML = '<option value="">Selecione uma apresentação</option>';
    embalagem.disabled = true;
}

// Atualizar apresentações comerciais conforme o produto
function atualizarApresentacoes() {
    const tipo = document.getElementById("tipo").value;
    const embalagem = document.getElementById("embalagem");

    embalagem.innerHTML = '<option value="">Selecione uma apresentação</option>';

    if (!configuracaoProdutos[tipo]) {
        embalagem.disabled = true;
        return;
    }

    Object.entries(configuracaoProdutos[tipo].embalagens).forEach(([valor, descricao]) => {
        const opcao = document.createElement("option");
        opcao.value = valor;
        opcao.textContent = descricao;
        embalagem.appendChild(opcao);
    });

    embalagem.disabled = false;
    embalagem.selectedIndex = 1;
}

// Buscar produto pelo tipo
async function buscarProduto() {
    const tipo = document.getElementById("tipo").value;

    if (!tipo) {
        alert("Selecione um produto.");
        return;
    }

    atualizarApresentacoes();

    try {
        const resposta = await fetch(
            "/produtos/buscar?tipo=" + encodeURIComponent(tipo)
        );

        const produto = await resposta.json();

        if (!resposta.ok) {
            alert(produto.erro);
            return;
        }

        const unidade = configuracaoProdutos[produto.tipo].unidade;

        document.getElementById("idProduto").value = produto.idProduto;
        document.getElementById("quantidadeAtual").value =
            produto.quantidade + " " + unidade;

        document.getElementById("quantidadeAtual").dataset.quantidade =
            produto.quantidade;

        document.getElementById("quantidade").value = 1;

    } catch (erro) {
        alert("Erro ao consultar produto.");
        console.error(erro);
    }
}

// Carregar todos os produtos
async function carregarProdutos() {
    try {
        const resposta = await fetch("/produtos/listar");

        if (!resposta.ok) {
            throw new Error("Erro HTTP: " + resposta.status);
        }

        const produtos = await resposta.json();

        const lista = document.getElementById("listaProdutos");
        lista.innerHTML = "";

        produtos.forEach(produto => {
            const linha = document.createElement("tr");

            const adicionarCelula = (valor) => {
                const celula = document.createElement("td");
                celula.textContent = valor ?? "";
                linha.appendChild(celula);
            };

            const unidade = configuracaoProdutos[produto.tipo].unidade;

            adicionarCelula(produto.tipo);
            adicionarCelula(produto.quantidade + " " + unidade);

            const celulaAcao = document.createElement("td");
            const botao = document.createElement("button");

            botao.textContent = "Alterar";
            botao.type = "button";

            botao.addEventListener("click", async () => {
                document.getElementById("tipo").value = produto.tipo;
                atualizarApresentacoes();
                await buscarProduto();

                document.getElementById("formProduto")
                    .scrollIntoView({ behavior: "smooth" });
            });

            celulaAcao.appendChild(botao);
            linha.appendChild(celulaAcao);

            lista.appendChild(linha);
        });

    } catch (erro) {
        console.error("Erro ao carregar produtos:", erro);
        alert("Não foi possível carregar a lista de produtos.");
    }
}

// Consultar produto automaticamente ao selecionar
document.getElementById("tipo").addEventListener("change", () => {
    document.getElementById("idProduto").value = "";
    document.getElementById("quantidadeAtual").value = "";
    document.getElementById("quantidadeAtual").dataset.quantidade = "";
    document.getElementById("quantidade").value = "";

    buscarProduto();
});

// Salvar alteração de estoque
document.getElementById("formProduto").addEventListener("submit", async function (event) {
    event.preventDefault();

    const idProduto = document.getElementById("idProduto").value;
    const tipo = document.getElementById("tipo").value;
    const embalagem = document.getElementById("embalagem").value;
    const quantidadeEmbalagens = document.getElementById("quantidade").value;
    const quantidadeAtual = Number(
        document.getElementById("quantidadeAtual").dataset.quantidade
    );

    if (!idProduto) {
        alert("Consulte ou selecione um produto antes de salvar.");
        return;
    }

    if (!embalagem) {
        alert("Selecione uma apresentação comercial.");
        return;
    }

    if (
        quantidadeEmbalagens === "" ||
        !Number.isSafeInteger(Number(quantidadeEmbalagens)) ||
        Number(quantidadeEmbalagens) <= 0
    ) {
        alert("Informe uma quantidade inteira de embalagens maior que zero.");
        return;
    }

    const quantidadeAdicionada =
        Number(embalagem) * Number(quantidadeEmbalagens);

    const novaQuantidade = quantidadeAtual + quantidadeAdicionada;

    if (!Number.isSafeInteger(novaQuantidade)) {
        alert("A quantidade informada é muito grande.");
        return;
    }

    try {
        const resposta = await fetch("/produtos/atualizar", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                idProduto,
                quantidade: quantidadeAdicionada
            })
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            alert(resultado.erro);
            return;
        }

        const unidade = configuracaoProdutos[tipo].unidade;

        alert(resultado.mensagem +
            "\nProduto: " + tipo +
            "\nQuantidade adicionada: " + quantidadeAdicionada + " " + unidade +
            "\nNovo estoque: " + novaQuantidade + " " + unidade);

        limparFormulario();
        await carregarProdutos();

    } catch (erro) {
        alert("Erro ao atualizar produto.");
        console.error(erro);
    }
});

carregarProdutos();