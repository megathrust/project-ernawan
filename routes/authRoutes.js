import express from 'express';
import crypto from 'crypto';
import { EmailService } from '../services/EmailServices.js';

class AuthRoutes {
  constructor(userModel, authService) {
    this.router = express.Router();
    this.userModel = userModel;
    this.authService = authService;
    this.emailService = new EmailService();
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.get('/login', this.login.bind(this));
    this.router.post('/login', this.loginLogic.bind(this));

    this.router.get('/register', this.register.bind(this));
    this.router.post('/register', this.registerLogic.bind(this));
    this.router.get('/verify-email', this.verifyEmail.bind(this));

    this.router.get('/forgot-password', this.forgotPassword.bind(this));
    this.router.post('/forgot-password', this.forgotPasswordLogic.bind(this));
    this.router.get('/reset-password', this.resetPassword.bind(this));
    this.router.post('/reset-password', this.resetPasswordLogic.bind(this));

    this.router.get('/logout', this.logout.bind(this));
  }

  login(req, res) {
    res.render('auth/login', {
        title: 'Login',
        layout: 'layouts/main',
    });
  }

  async loginLogic(req, res) {
    try {
      const { email_user: email, password_user: password } = req.body;
      const user = await this.userModel.findEmail(email);
  
      if (!user) {
        req.flash('error_msg', 'User Tidak Tersedia');
        return res.redirect('/auth/login');
      }
  
      const isValidPassword = await this.userModel.comparePassword(password, user.password);
      if (!isValidPassword) {
        req.flash('error_msg', 'Password Salah');
        return res.redirect('/auth/login');
      }
  
      if (!user.is_verified) {
        req.flash('error_msg', 'Email Kamu Belum Dikonfirmasi');
        return res.redirect('/auth/login');
      }
  
      req.session.user = {
        userId: user.id,
        username: user.username,
        email: user.email,
        is_admin: user.is_admin,
      };
      
      req.session.save((err) => {
          if (err) {
              req.flash('error_msg', 'Terjadi Kesalahan');
              console.error(err);
              return res.redirect('/auth/login');
          }
          req.flash('success_msg', 'Selamat Datang User');
          return res.redirect('/');
      });    
    } catch (error) {
      console.error('Login error:', error);
      req.flash('error_msg', 'Terjadi Kesalahan');
      res.redirect('/auth/login');
    }
  }
  

  register(req, res) {
    res.render('auth/register', {
        title: 'Register',
        layout: 'layouts/main',
    });
  }

  async registerLogic(req, res) {
    console.log('Request body received:', req.body);

    const { nama_user: username, email_user: email, password_user: password } = req.body;

    if (!username || !email || !password) {
        console.error('Invalid input:', { username, email, password });
        return res.redirect('/auth/register');
    }

    try {
        const { verificationToken } = await this.userModel.register(username, email, password);
        const verificationLink = `${req.protocol}://${req.get('host')}/auth/verify-email?token=${verificationToken}`;

        await this.authService.sendVerificationEmail(email, verificationLink);

        req.flash('success_msg', 'Registration successful! Please check your email for verification.');
        res.redirect('/auth/login');
    } catch (error) {
        console.error('Error in registration:', error.message);
        req.flash('error', error.message);
        res.redirect('/auth/register');
    }
  }

  async verifyEmail(req, res) {
    try {
        const { token } = req.query;
        const isVerified = await this.userModel.verifyEmail(token);

        if (isVerified) {
            req.flash('success_msg', 'Email verified successfully!');
            res.redirect('/auth/login')
        } else {
            res.flash('error_msg', 'Invalid verification token!');
            res.redirect('/auth/register')
        }
    } catch (error) {
        console.error(error);
        res.send('An error occurred during verification.');
    }
  }

  forgotPassword(req, res) {
    res.render('auth/forgot-password', {
        title: 'Forgot Password',
        layout: 'layouts/main',
    });
  }

  async forgotPasswordLogic(req, res) {
    try {
      const { email_user: email } = req.body;
      const user = await this.userModel.findEmail(email);

      if (!user) {
        req.flash('error_msg', 'Email tidak terdaftar');
        return res.redirect('/auth/forgot-password');
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 3600000); // Token expires in 1 hour

      // Save reset token to database
      await this.userModel.updateResetToken(email, resetToken, expiresAt);

      // Generate reset link
      const resetLink = `${req.protocol}://${req.get('host')}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

      // Send reset password email
      await this.emailService.sendResetPasswordEmail(email, resetLink);

      req.flash('success_msg', 'Link reset password telah dikirim ke email Anda');
      res.redirect('/auth/login');
    } catch (error) {
      console.error('Forgot password error:', error);
      req.flash('error_msg', 'Terjadi kesalahan saat memproses permintaan');
      res.redirect('/auth/forgot-password');
    }
  }

  async resetPasswordLogic(req, res) {
    try {
        const { token, email } = req.body; // Change from req.query to req.body
        const { password_baru: newPassword } = req.body;

        if (!token || !email || !newPassword) {
            req.flash('error_msg', 'Data tidak lengkap');
            return res.redirect('/auth/forgot-password');
        }

        // Verify token and email combination
        const user = await this.userModel.verifyResetToken(email, token);

        if (!user) {
            req.flash('error_msg', 'Link reset password tidak valid atau sudah kadaluarsa');
            return res.redirect('/auth/forgot-password');
        }

        // Reset password
        await this.userModel.resetPassword(email, newPassword);

        req.flash('success_msg', 'Password berhasil direset. Silakan login dengan password baru');
        res.redirect('/auth/login');
    } catch (error) {
        console.error('Reset password error:', error);
        req.flash('error_msg', 'Terjadi kesalahan saat mereset password');
        res.redirect('/auth/forgot-password');
    }
}

  logout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        req.flash('error_msg', 'Terjadi kesalahan saat logout');
        return res.redirect('/');
      }
      res.clearCookie('connect.sid'); // Clear session cookie
      res.redirect('/');
    });
  }

  resetPassword(req, res) {
    const { token, email } = req.query;
    res.render('auth/reset-password', {
        title: 'Reset Password',
        layout: 'layouts/main',
        token: token,
        email: email
    });
  }
}

export default (userModel, authService) => new AuthRoutes(userModel, authService).router;
