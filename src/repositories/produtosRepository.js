const con = require('../config/database');

// Listar todos os produtos
function listar() {
    return new Promise((resolve, reject) => {
        con.query(
            'SELECT idProduto, tipo, quantidade FROM Produto ORDER BY idProduto',
            (err, resultado) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(resultado);
                }
            }
        );
    });
}

// Buscar produto pelo tipo
function buscar(tipo) {
    return new Promise((resolve, reject) => {
        con.query(
            'SELECT idProduto, tipo, quantidade FROM Produto WHERE tipo = ?',
            [tipo],
            (err, resultado) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(resultado[0] || null);
                }
            }
        );
    });
}

// Atualizar quantidade em estoque
function atualizar(idProduto, quantidade) {
    return new Promise((resolve, reject) => {
        con.query(
            'UPDATE Produto SET quantidade = quantidade + ? WHERE idProduto = ?',
            [quantidade, idProduto],
            (err, resultado) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(resultado);
                }
            }
        );
    });
}

module.exports = {
    listar,
    buscar,
    atualizar
};
