const formCadastro = document.getElementById('formCadastro');
const mensagemCadastro = document.getElementById('mensagem');

formCadastro.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const usuario = document.getElementById('usuario').value.trim();
    const senha = document.getElementById('senha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;

    mensagemCadastro.textContent = '';
    mensagemCadastro.className = 'mensagem';

    if (senha !== confirmarSenha) {
        mensagemCadastro.textContent = 'As senhas não coincidem.';
        mensagemCadastro.classList.add('erro');
        return;
    }

    try {
        const resposta = await fetch('/auth/cadastro-inicial', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ usuario, senha, confirmarSenha })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || 'Não foi possível criar a conta.');
        }

        mensagemCadastro.textContent =
            `${dados.mensagem} Redirecionando para o login...`;
        mensagemCadastro.classList.add('sucesso');

        formCadastro.reset();

        setTimeout(() => {
            window.location.href = '/login.html';
        }, 1500);
    } catch (erro) {
        mensagemCadastro.textContent = erro.message;
        mensagemCadastro.classList.add('erro');
    }
});
