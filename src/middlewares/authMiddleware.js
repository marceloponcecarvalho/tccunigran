const authService = require('../services/authService');

async function exigirAutenticacao(req, res, next) {
    try {
        const conta = await authService.obterUsuario();

        if (!conta) {
            if (req.originalUrl.startsWith('/auth/')) {
                return res.status(401).json({
                    erro: 'Conta administrativa ainda não cadastrada.'
                });
            }

            return res.redirect('/cadastro-inicial.html');
        }

        const sessaoValida =
            req.session &&
            req.session.autenticado === true &&
            req.session.versaoCredenciais === conta.versao;

        if (!sessaoValida) {
            if (req.session) {
                req.session.destroy(() => {});
            }

            if (req.path.startsWith('/clientes') ||
                req.path.startsWith('/produtos') ||
                req.path.startsWith('/agendamentos') ||
                req.path.startsWith('/manutencoes') ||
                req.originalUrl.startsWith('/auth/')) {
                return res.status(401).json({
                    erro: 'Autenticação necessária.'
                });
            }

            return res.redirect('/login.html');
        }

        next();
    } catch (erro) {
        next(erro);
    }
}

module.exports = {
    exigirAutenticacao
};
