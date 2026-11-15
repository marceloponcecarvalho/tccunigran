document.getElementById('botaoSair').addEventListener('click', async () => {
    try {
        const resposta = await fetch('/auth/logout', {
            method: 'POST'
        });

        if (!resposta.ok) {
            throw new Error('Não foi possível encerrar a sessão.');
        }

        window.location.href = '/login.html';
    } catch (erro) {
        alert(erro.message);
    }
});
