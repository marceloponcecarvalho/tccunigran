const formConta = document.getElementById('formConta');
const mensagemConta = document.getElementById('mensagem');
const botaoSair = document.getElementById('botaoSair');

formConta.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const novoUsuario = document.getElementById('novoUsuario').value.trim();
    const novaSenha = document.getElementById('novaSenha').value;
    const confirmarNovaSenha =
        document.getElementById('confirmarNovaSenha').value;
    const senhaAtual = document.getElementById('senhaAtual').value;

    mensagemConta.textContent = '';
    mensagemConta.className = 'mensagem';

    if (!novoUsuario && !novaSenha) {
        mensagemConta.textContent =
            'Informe um novo nome de usuário ou uma nova senha.';
        mensagemConta.classList.add('erro');
        return;
    }

    if (novaSenha !== confirmarNovaSenha) {
        mensagemConta.textContent =
            'A confirmação da nova senha não corresponde à senha informada.';
        mensagemConta.classList.add('erro');
        return;
    }

    try {
        const resposta = await fetch('/auth/conta', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                novoUsuario,
                novaSenha,
                confirmarNovaSenha,
                senhaAtual
            })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || 'Não foi possível alterar a conta.');
        }

        mensagemConta.textContent =
            `${dados.mensagem} Redirecionando para o login...`;
        mensagemConta.classList.add('sucesso');

        formConta.reset();

        setTimeout(() => {
            window.location.href = '/login.html';
        }, 1800);
    } catch (erro) {
        mensagemConta.textContent = erro.message;
        mensagemConta.classList.add('erro');
    }
});

botaoSair.addEventListener('click', async () => {
    try {
        const resposta = await fetch('/auth/logout', {
            method: 'POST'
        });

        if (!resposta.ok) {
            const dados = await resposta.json();
            throw new Error(dados.erro || 'Não foi possível encerrar a sessão.');
        }

        window.location.href = '/login.html';
    } catch (erro) {
        mensagemConta.textContent = erro.message;
        mensagemConta.className = 'mensagem erro';
    }
});
