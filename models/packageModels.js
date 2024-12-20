export class PackageModel {
    constructor(db) {
        this.db = db;
    }

    async findById(id) {
        const [rows] = await this.db.query('SELECT * FROM packages WHERE id = ?', [id]);
        return rows[0];
    }

    async findAll() {
        const [rows] = await this.db.query('SELECT * FROM packages');
        return rows;
    }

    async create(packageData) {
        const { name, price } = packageData;
        const [result] = await this.db.query(
            'INSERT INTO packages (name, price) VALUES (?, ?)',
            [name, price]
        );
        return result.insertId;
    }

    async update(id, packageData) {
        const { name, price } = packageData;
        await this.db.query(
            'UPDATE packages SET name = ?, price = ? WHERE id = ?',
            [name, price, id]
        );
    }

    async delete(id) {
        await this.db.query('DELETE FROM packages WHERE id = ?', [id]);
    }

    async checkSchedule(tanggal, jam) {
        const query = `SELECT * FROM orders WHERE DATE(order_date) = ? AND TIME(order_date) = ?`;
        const params = [tanggal, jam];
        const [rows] = await this.db.query(query, params);

        if (rows.length > 0) {
            return { available: false, message: 'Jadwal sudah terisi untuk waktu ini.' };
        } else {
            return { available: true, message: 'Jadwal masih tersedia untuk waktu ini.' };
        }
    }
}
