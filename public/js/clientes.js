// Limpar o formulario
// Criei o const form para chamar ao final e tratar o negrito dos campos que estavam errados
function limparFormulario() {
    const form = document.getElementById("formCliente");

    form.reset();
    document.getElementById("idCliente").value = "";

    form.querySelectorAll("input").forEach(campo => {
        campo.style.fontWeight = "normal";
        campo.style.border = "";
    });

    const botaoSalvar = form.querySelector("button[type='submit']");
    botaoSalvar.textContent = "Salvar";
}

// Ajustei a função para validar a quantidade de digitos do cpf ou cnpj
// A verificação estava sendo feita apenas no server.js antes de gravar e consultar o BD 
// mas permitia o retorno de dados invalido por erro do usuario

async function buscarCliente() {
    const cpf = document.getElementById("cpf").value.trim();
    const cpfNumeros = cpf.replace(/\D/g, "");

    if (!cpf) {
        alert("Informe o CPF/CNPJ.");
        return;
    }

    // Chama a função para valirdar o CPF
    if (!validarCpfCnpj()) {
        alert(document.getElementById("cpf").validationMessage);
        destacarCampo("cpf");
        return;
    }

    try {
        const resposta = await fetch(
            "/clientes/buscar?cpf=" + encodeURIComponent(cpfNumeros)
        );

        const cliente = await resposta.json();

        if (!resposta.ok) {
            alert(cliente.erro);
            return;
        }

        if (!cliente) {
            document.getElementById("idCliente").value = "";

            document.querySelector("[name=nome]").value = "";
            document.querySelector("[name=endereco]").value = "";
            document.querySelector("[name=telefone]").value = "";
            document.querySelector("[name=email]").value = "";
            document.querySelector("[name=profundidade]").value = "";
            document.querySelector("[name=lado1]").value = "";
            document.querySelector("[name=lado2]").value = "";

            alert("Cliente não encontrado. Preencha os dados para cadastrá-lo.");
            return;
        }

        // Preenche os dados do cliente encontrado
        document.getElementById("idCliente").value = cliente.idCliente;

        document.querySelector("[name=nome]").value = cliente.nome || "";
        document.querySelector("[name=cpf]").value = cliente.cpf || "";
        document.querySelector("[name=endereco]").value = cliente.endereco || "";
        document.querySelector("[name=telefone]").value = cliente.telefone || "";
        document.querySelector("[name=email]").value = cliente.email || "";

        // Preenche as dimensões da piscina
        document.querySelector("[name=profundidade]").value =
            cliente.profundidade ?? "";

        document.querySelector("[name=lado1]").value =
            cliente.lado1 ?? "";

        document.querySelector("[name=lado2]").value =
            cliente.lado2 ?? "";

        alert("Carregados os Dados do cliente: " + cliente.nome);

    } catch (erro) {
        alert("Erro ao consultar cliente.");
        console.error(erro);
    }
}

async function carregarClientes() {
    try {
        const resposta = await fetch("/clientes/listar");

        if (!resposta.ok) {
            throw new Error("Erro HTTP: " + resposta.status);
        }

        const clientes = await resposta.json();

        const lista = document.getElementById("listaClientes");
        lista.innerHTML = "";

        clientes.forEach(cliente => {
            const linha = document.createElement("tr");

            const adicionarCelula = (valor) => {
                const celula = document.createElement("td");
                celula.textContent = valor ?? "";
                linha.appendChild(celula);
            };

            adicionarCelula(cliente.nome);
            adicionarCelula(cliente.cpf);
            adicionarCelula(cliente.endereco);
            adicionarCelula(cliente.telefone);
            adicionarCelula(cliente.email);
            adicionarCelula(
                cliente.volume !== null
                    ? Number(cliente.volume).toFixed(2) + " m³"
                    : "Não informado"
            );

            const celulaAcao = document.createElement("td");
            const botao = document.createElement("button");

            botao.textContent = "Alterar";
            botao.type = "button";

            botao.addEventListener("click", async () => {
                document.getElementById("cpf").value = cliente.cpf;
                await buscarCliente();

                document.getElementById("formCliente")
                    .scrollIntoView({ behavior: "smooth" });
            });

            celulaAcao.appendChild(botao);
            linha.appendChild(celulaAcao);

            lista.appendChild(linha);
        });

    } catch (erro) {
        console.error("Erro ao carregar clientes:", erro);
        alert("Não foi possível carregar a lista de clientes.");
    }
}
document.getElementById("formCliente").addEventListener("submit", async function (event) {
    event.preventDefault();

    try {
        const dados = Object.fromEntries(new FormData(this));

        const resposta = await fetch("/clientes/salvar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dados)
        });

        const resultado = await resposta.json();

        // Trata a resposta para negritar o campo que deve ser corrigido.
        if (!resposta.ok) {
            alert(resultado.erro);

            if (resultado.camposInvalidos) {
                resultado.camposInvalidos.forEach(campo => {
                    destacarCampo(campo);
                });
            }

            return;
        }

        alert(resultado.mensagem +
            "\nCódigo do cliente: " + resultado.idCliente);

        this.reset();
        document.getElementById("idCliente").value = "";

        // Trata a resposta do servidor para negritar o campo que deve ser corrigido.
        this.querySelectorAll("input").forEach(campo => {
            campo.style.fontWeight = "normal";
            campo.style.border = "";
        });

        await carregarClientes();

    } catch (erro) {
        alert("Erro ao salvar cliente.");
        console.error(erro);
    }
});

// Incluida a função para negritar o campo que deve ser corrigido.
function destacarCampo(nome) {
    const campo = document.querySelector(`[name="${nome}"]`);

    if (campo) {
        campo.style.fontWeight = "bold";
        campo.style.border = "2px solid red";
        campo.focus();
    }
}
const form = document.getElementById("formCliente");

// Incluida função para validar o CPF/CNPJ
function validarCpfCnpj() {
    const campo = document.getElementById("cpf");
    const digitos = campo.value.replace(/\D/g, "");

    const valido = digitos.length === 11 || digitos.length === 14;

    campo.setCustomValidity(
        valido ? "" : "Informe um CPF com 11 dígitos ou CNPJ com 14 dígitos."
    );

    return valido;
}

// Valida enquanto o usuário digita
document.getElementById("cpf").addEventListener("input", validarCpfCnpj);

// Validação inicial
validarCpfCnpj();

carregarClientes();
