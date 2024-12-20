import express from 'express';
import Database from '../config/config.database.js';
import { PackageModel } from '../models/packageModels.js';
import { EmailService } from '../services/EmailServices.js';
import { AuthService } from '../services/AuthServices.js';

class HomeRoutes {
  constructor() {
    this.router = express.Router();
    this.db = new Database();
    this.auth = new AuthService()
    this.packageModel = new PackageModel(this.db.getPool());
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.get('/', this.homePage.bind(this));
    this.router.get('/pemesanan/:id', this.auth.reqAuth, this.checkOut.bind(this));
    this.router.post('/cek-jadwal', this.auth.reqAuth, this.cekJadwal.bind(this));
    this.router.post('/submit-order', this.auth.reqAuth, this.submitOrder.bind(this));
  }

  async homePage(req, res) {
    try {
      const [packages] = await this.db.getPool().execute('SELECT * FROM packages');
      const isAdmin = req.session.user?.is_admin || false;
      packages.forEach(pkg => {
        pkg.price = parseFloat(pkg.price); 
      });
      res.render('homepage', {
        user: req.session.user,
        title: 'Dashboard',
        admin: isAdmin,
        layout: 'layouts/main',
        packages,
      });
    } catch (error) {
      req.flash('error_msg', 'Terjadi Kesalahan');
      return res.redirect('/');
    }
  }

  async checkOut(req, res) {
    const { id } = req.params;
    try {
      const [packageData] = await this.packageModel.db.query('SELECT * FROM packages WHERE id = ?', [id]);

      if (!packageData.length) {
        req.flash('error_msg', 'Paket tidak ditemukan.');
        return res.redirect('/');
      }

      res.render('checkout', {
        title: 'Pemesanan',
        layout: 'layouts/main',
        package: packageData[0],
      });
    } catch (error) {
      req.flash('error_msg', 'Terjadi Kesalahan');
      return res.redirect('/pemesanan');
    }
  }

  async cekJadwal(req, res) {
    const { tanggal, jam } = req.body;

    try {
      if (!tanggal || !jam) {
        return res.status(400).json({ message: 'Tanggal dan jam harus diisi.' });
      }

      const [hour, minute] = jam.split(':').map(Number);
      const jamAngka = hour + minute / 60;

      const pagiSiangMulai = 6;
      const pagiSiangSelesai = 15;
      const soreMalamMulai = 17;
      const soreMalamSelesai = 23.99;
      const istirahat1Mulai = 0;
      const istirahat1Selesai = 5.99;
      const istirahat2Mulai = 15.01;
      const istirahat2Selesai = 16.99;

      if (
        (jamAngka >= istirahat1Mulai && jamAngka <= istirahat1Selesai) ||
        (jamAngka >= istirahat2Mulai && jamAngka <= istirahat2Selesai)
      ) {
        return res.json({
          available: false,
          message: 'Waktu ini tidak tersedia karena waktu istirahat.',
        });
      }

      let waktuKategori = '';
      if (jamAngka >= pagiSiangMulai && jamAngka <= pagiSiangSelesai) {
        waktuKategori = 'pagi-siang';
      } else if (jamAngka >= soreMalamMulai && jamAngka <= soreMalamSelesai) {
        waktuKategori = 'sore-malam';
      } else {
        return res.json({
          available: false,
          message: 'Waktu yang dipilih tidak valid.',
        });
      }

      const query = `
        SELECT * FROM orders 
        WHERE DATE(order_date) = ? 
        AND (TIME(order_date) BETWEEN ? AND ?)
      `;
      const waktuAwal = waktuKategori === 'pagi-siang' ? '06:00' : '17:00';
      const waktuAkhir = waktuKategori === 'pagi-siang' ? '15:00' : '23:59';

      const [rows] = await this.db.getPool().execute(query, [tanggal, waktuAwal, waktuAkhir]);

      if (rows.length > 0) {
        return res.json({
          available: false,
          message: `Jadwal ${waktuKategori} pada tanggal ${tanggal} sudah tidak tersedia.`,
        });
      }

      return res.json({
        available: true,
        message: `Jadwal ${waktuKategori} pada tanggal ${tanggal} tersedia.`,
      });
    } catch (error) {
      console.error('Error in cekJadwal route:', error);
      req.flash('error_msg', 'Terjadi Kesalahan');
      return res.redirect('/pemesanan');
    }
  }

  async submitOrder(req, res) {
    const { nama, email, tanggal, jam, selectedPackage } = req.body;

    try {
      if (!selectedPackage || !selectedPackage.name || !selectedPackage.price) {
        req.flash('error_msg', 'Data paket tidak valid.');
        return res.redirect('/pemesanan');
      }

      const orderDate = new Date(`${tanggal}T${jam}`);
      if (isNaN(orderDate.getTime())) {
        req.flash('error_msg', 'Tanggal atau jam tidak valid.');
        return res.redirect('/pemesanan');
      }

      const userId = req.session.user?.userId || null;
      if (!userId) {
        req.flash('error_msg', 'Anda harus login untuk membuat pesanan.');
        return res.redirect('/auth/login');
      }

      const [packageData] = await this.db.getPool().execute(
        'SELECT id FROM packages WHERE name = ? AND price = ?',
        [selectedPackage.name, selectedPackage.price]
      );

      if (!packageData.length) {
        req.flash('error_msg', 'Paket tidak ditemukan.');
        return res.redirect('/pemesanan');
      }

      const packageId = packageData[0].id;
      const totalPrice = parseFloat(selectedPackage.price);

      await this.db.getPool().execute(
        'INSERT INTO orders (user_id, package_id, order_date, total_price) VALUES (?, ?, ?, ?)',
        [userId, packageId, orderDate, totalPrice]
      );

      const emailService = new EmailService();
      await emailService.sendOrderWithPDF(email, process.env.EMAIL_OWNER, { nama, email, tanggal, jam, paket: { name: selectedPackage.name, price: totalPrice } });

      req.flash('success_msg', 'Detail pesanan telah dikirimkan ke email Anda.');
      return res.redirect('/');
    } catch (error) {
      req.flash('error_msg', 'Terjadi Kesalahan');
      return res.redirect('/pemesanan');
    }
  }
}

export default new HomeRoutes().router;