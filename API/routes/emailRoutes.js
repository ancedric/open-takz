import dotenv from 'dotenv'
dotenv.config()
import express from 'express';
import nodemailer from 'nodemailer';

const mailRouter = express.Router();

//configuration de nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth:{
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PWD
    }
})

// Route pour envoyer un email
mailRouter.post('/send-email', async (req, res) => {
    const { to, subject, text } = req.body;

    const mailOptions = {
        from: process.env.BREVO_SMTP_USER,
        to,
        subject,
        text,
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Email envoyé avec succès' });
    } catch (error) {
        res.status(500).json({ error: 'Échec de l\'envoi de l\'email', details: error.message });
    }
});

export default mailRouter;