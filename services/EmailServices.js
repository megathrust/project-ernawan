import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import path from 'path';
import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.PASS_USER
            }
        })
    }

    async sendVerificationEmail(email, verificationLink) {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Email Verification',
            html: `
                <h1>Email Verification</h1>
                <p>Please verify your email by clicking the link below:</p>
                <a href="${verificationLink}">Verify Email</a>
                <p>If you did not register, please ignore this email.</p>
            `,
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log('Verification email sent');
        } catch (error) {
            console.error('Email sending error:', error);
            throw new Error('Failed to send verification email');
        }
    }

    async sendResetPasswordEmail(email, resetLink) {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Reset Password',
            html: `
                <h1>Password Reset</h1>
                <p>You have requested to reset your password. Click the link below to reset:</p>
                <a href="${resetLink}">Reset Password</a>
                <p>If you did not request this, please ignore this email.</p>
            `
        }

        try {
            await this.transporter.sendMail(mailOptions);
            console.log('Reset password email sent');
        } catch (error) {
            console.error('Email sending error:', error);
            throw new Error('Failed to send reset password email');
        }
    }

    async sendOrderWithPDF(email, ownerEmail, orderDetails, whatsappLink) {
        const pdfPath = path.resolve(__dirname, `../temp/order_${Date.now()}.pdf`)
        this.generateOrderPDF(pdfPath, orderDetails);

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: [email, ownerEmail],
            subject: 'Detail Pesanan',
            html: `
                <p>Terima kasih telah melakukan pemesanan! Berikut detail pesanan Anda dalam lampiran PDF.</p>
                <a href="${whatsappLink}" style="padding: 10px; background: #25D366; color: white; text-decoration: none; border-radius: 5px;">Hubungi via WhatsApp</a>
            `,
            attachments: [
                {
                    filename: 'Detail_Pesanan.pdf',
                    path: pdfPath,
                },
            ],
        }

        try {
            await this.transporter.sendMail(mailOptions),
            console.log('Email Sukses')
        } catch (error) {
            console.error('Email sending error:', error);
            throw new Error('Failed to send email with PDF');
        } finally {
            fs.unlink(pdfPath, (err) => {
                if (err) console.error('Error deleting PDF:', err);
            });
        }
    }

    generateOrderPDF(filePath, { nama, email, tanggal, jam, paket }) {
        const doc = new PDFDocument();

        doc.pipe(fs.createWriteStream(filePath));
        doc.fontSize(20).text('Detail Pemesanan Gedung', { align: 'center'}).moveDown(1);

        doc.fontSize(12)
            .text(`Nama Pemesan: ${nama}`, { continued: true })
            .text(`\nEmail: ${email}`)
            .text(`\nTanggal Pemesanan: ${tanggal}`)
            .text(`\nJam Pemesanan: ${jam}`)
            .text(`\nPaket: ${paket.name} - ${paket.price}`, { continued: true });

        doc.moveDown(2).fontSize(10).text('Terima kasih telah melakukan pemesanan!', { align: 'center' });

        doc.end();
    }
}