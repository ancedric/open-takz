// services/email.service.js

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST,
    port: process.env.BREVO_SMTP_PORT,
    secure: false, // Utilisez 'true' si le port est 465, 'false' pour 587
    auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_API_KEY
    }
});

export const sendEmail = async (to, subject, htmlContent) => {
    try {
        const mailOptions = {
            from: process.env.BREVO_SMTP_USER, // L'adresse de l'expéditeur doit être vérifiée sur Brevo
            to: to,
            subject: subject,
            html: htmlContent
        };
        
        await transporter.sendMail(mailOptions);
        console.log('Email envoyé avec succès !');
        return true;
    } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email :', error);
        return false;
    }
};