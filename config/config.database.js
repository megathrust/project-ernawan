import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

class Database {
    constructor() {
        dotenv.config();
        this.pool = mysql.createPool({
            host: process.env.HOST,
            user: process.env.USER_DB,
            password: process.env.PASSWORD_DB,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            multipleStatements: true // Menambahkan dukungan untuk multi-query
        });
    }

    async connect() {
        try {
            const connection = await this.pool.getConnection();
            console.log('Database connected successfully');
            connection.release();
        } catch (error) {
            console.error('Database connection failed:', error);
            throw error;
        }
    }

    async initializeDatabase() {
        const createUserTableQuery = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                verification_token VARCHAR(255),
                is_admin BOOLEAN DEFAULT FALSE,
                is_verified BOOLEAN DEFAULT FALSE,
                reset_token VARCHAR(255),
                reset_token_expires DATETIME,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        const createPackageTableQuery = `
            CREATE TABLE IF NOT EXISTS packages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                price DECIMAL(10, 2) NOT NULL
            );
        `;

        const createOrderTableQuery = `
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                package_id INT NOT NULL,
                order_date DATETIME NOT NULL,
                total_price DECIMAL(10, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
            );
        `;

        try {
            // Eksekusi query satu per satu
            await this.pool.execute(createUserTableQuery);
            await this.pool.execute(createPackageTableQuery);
            await this.pool.execute(createOrderTableQuery);
            console.log('Tables initialized successfully');
        } catch (error) {
            console.error('Table initialization error:', error);
        }
    }

    getPool() {
        return this.pool;
    }
}

export default Database;