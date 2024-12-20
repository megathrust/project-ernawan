import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export class UserModel {
    constructor(db) {
        this.db = db;
    }

    async register(username, email, password) {
        const hashedPassword = await bcrypt.hash(password, 10);
    
        // Buat token verifikasi unik
        const verificationToken = crypto.randomBytes(32).toString('hex');
    
        const query = `
            INSERT INTO users (username, email, password, verification_token)
            VALUES (?, ?, ?, ?)
        `;
    
        try {
            const [result] = await this.db.execute(query, [username, email, hashedPassword, verificationToken]);
            return { userId: result.insertId, verificationToken };
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Username or email already exists');
            }
            throw error;
        }
    }

    async verifyEmail(token) {
        const query = `UPDATE users SET is_verified = 1, verification_token = NULL WHERE verification_token = ?`;
        const [result] = await this.db.execute(query, [token]);
        return result.affectedRows > 0;
    }

    async findEmail(email) {
        const query = `SELECT * FROM users WHERE email = ?`;
        const [rows] = await this.db.execute(query, [email]);
        return rows[0];
    }

    async comparePassword(inputPassword, storedPassword) {
        return await bcrypt.compare(inputPassword, storedPassword);
    }

    async updateResetToken(email, token, expiresAt) {
        const query = `
            UPDATE users 
            SET reset_token = ?, 
                reset_token_expires = ? 
            WHERE email = ?
        `;
        const [result] = await this.db.execute(query, [token, expiresAt, email]);
        return result.affectedRows > 0;
    }

    async findByResetToken(token) {
        const query = `
            SELECT * FROM users 
            WHERE reset_token = ? 
            AND reset_token_expires > NOW()
        `;
        const [rows] = await this.db.execute(query, [token]);
        return rows[0];
    }

    async verifyResetToken(email, token) {
        const query = `
            SELECT * FROM users 
            WHERE email = ? 
            AND reset_token = ? 
            AND reset_token_expires > NOW()
        `;
        const [rows] = await this.db.execute(query, [email, token]);
        return rows[0];
    }

    async resetPassword(email, newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const query = `
            UPDATE users 
            SET password = ?,
                reset_token = NULL,
                reset_token_expires = NULL 
            WHERE email = ?
        `;
        const [result] = await this.db.execute(query, [hashedPassword, email]);
        
        if (result.affectedRows === 0) {
            throw new Error('User not found or token invalid');
        }
        return true;
    }

    async clearResetToken(email) {
        const query = `
            UPDATE users 
            SET reset_token = NULL,
                reset_token_expires = NULL 
            WHERE email = ?
        `;
        await this.db.execute(query, [email]);
    }
}