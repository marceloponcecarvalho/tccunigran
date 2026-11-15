const formLogin = document.getElementById('formLogin');
const mensagemLogin = document.getElementById('mensagem');

formLogin.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const usuario = document.getElementById('usuario').value.trim();
    const senha = document.getElementById('senha').value;

    mensagemLogin.textContent = '';
    mensagemLogin.className = 'mensagem';

    try {
        const resposta = await fetch('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ usuario, senha })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || 'Não foi possível realizar o login.');
        }

        window.location.href = '/index.html';
    } catch (erro) {
        mensagemLogin.textContent = erro.message;
        mensagemLogin.classList.add('erro');
    }
});
