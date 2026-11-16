require('dotenv').config();

const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE || "manutencao_piscinas",
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
});

module.exports = pool;
