require('dotenv').config();

const mysql = require('mysql2');

const con = mysql.createConnection({
    host: "localhost",
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: "manutencao_piscinas"
});

con.connect(function (err) {
    if (err) throw err;
    console.log("Conectado ao banco de dados!");
});

module.exports = con;
