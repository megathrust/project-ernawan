import crypto from 'crypto';
import { EmailService } from './EmailServices.js';

export class AuthService {
    constructor(userModel) {
        this.userModel = userModel;
        this.emailService = new EmailService();
    }

    generateResetToken() {
        return crypto.randomBytes(32).toString('hex')
    }

    async checkAuth (req, res, next) {
        res.locals.user = req.session?.user || null;
        next();
      }
    
    async reqAuth (req, res, next) {
        if (!req.session?.user) {
            req.flash('Login Terlebih Dahulu');
          return res.redirect('/auth/login');
        }
        next();
    }

    async checkIsAdmin(req, res, next) {
        if (req.session?.user && req.session.user.role === 'admin') {
            res.locals.isAdmin = true;
        } else {
            res.locals.isAdmin = false;
        }
        next();
    }

    async sendVerificationEmail(email, verificationLink) {
        try {
            await this.emailService.sendVerificationEmail(email, verificationLink);
            console.log('Verification email sent successfully to:', email);
        } catch (error) {
            console.error('Failed to send verification email:', error);
            throw new Error('Failed to send verification email');
        }
    }
    
    async intiatePasswordReset(email) {
        const user = await this.userModel.findByEmail(email);

        if(!email) {
            throw new Error('User not found')
        }

        const resetToken = this.generateResetToken();
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

        await this.userModel.updateResetToken(email, resetToken, expiresAt);

        const resetLink = `${process.env.FRIST}://${process.env.HOST}:${process.env.PORT}/reset-password/${resetToken}`;
        await this.emailService.sendResetPasswordEmail(email, resetLink);

        return resetToken;
    }

    async confirmPasswordReset(email, token, newPassword) {
        const user = await this.userModel.verifyResetToken(email, token);

        if (!user) {
            throw new Error('Invalid or expired reset token');
        }

        await this.userModel.resetPassword(email, newPassword);
    }


}