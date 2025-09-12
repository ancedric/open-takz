import dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql2/promise'; // 🟢 On utilise la version promesse

const db = await mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PWD,
    database: process.env.MYSQL_DB,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}); 

console.log('✅ Base de données connectée (mysql2/promise)');
export default db;
