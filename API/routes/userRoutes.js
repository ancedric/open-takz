import dotenv from 'dotenv';
dotenv.config();
import session from 'express-session';
import pg from 'pg';
import connectPgSimple from 'connect-pg-simple';
import fs from 'fs'
import db from '../services/mysqlConfig.js';
import bcrypt from 'bcrypt';
import upload from '../services/multerConfig.js';
import mysqlSession from 'express-mysql-session';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
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

const __filename = fileURLToPath(import.meta.url);
const userRouter = express.Router();
const __dirname = dirname(__filename);

// Initialisation du store
const MySQLStore = mysqlSession(session);

// Configuration de la session
const pgPool = new pg.Pool({
  host: process.env.PG_HOST,
  user: process.env.PG_USER,
  password: process.env.PG_PWD,
  database: process.env.PG_DB,
  port: process.env.PG_PORT || 5432,
});

const PgSession = connectPgSimple(session);

userRouter.use(session({
  store: new PgSession({
    pool: pgPool,
    tableName: 'user_sessions',
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // true en production avec HTTPS
    maxAge: 86400000,
  }
}));

// Vérifier si l'utilisateur est connecté
// Route pour récupérer les infos utilisateur (inclut le profil)
userRouter.get('/', (req, res) => {
    if (req.session.user) {
        return res.json({ 
        valid: true,
        user: {
            id: req.session.user.userRef,
            email: req.session.user.email,
            firstname: req.session.user.firstname,
            lastname: req.session.user.lastname,
            profilePhotoUrl: req.session.user.profilePhotoUrl,
            privilege: req.session.user.privilege,
            city: req.session.user.city,
            country: req.session.user.country
          // Ajoutez tous les champs nécessaires
        }
    })} else {
        return res.json({ valid: false })
    }
})

// routes pour récupérer la session
userRouter.get('/session', (req, res) => {
    if (req.session.user) {
        return res.json({
            authenticated: true,
            user: req.session.user
        })
    }
    res.json({ authenticated: false })
})

userRouter.post('/login', async (req, res) => {
    
    // Vérifier si le corps de la requête contient les champs requis 
    if (!req.body || !req.body.email || !req.body.password) {
        return res.status(400).json({ 
            message: 'Email et mot de passe requis',
            bodyReceived: req.body // Pour debug
        });
    }

    const { email, password } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM user WHERE email = ?', [email]);
        
        if (!rows || rows.length === 0) {

            console.error('Utilisateur non trouvé:', email); 
            return res.status(401).json({ message: 'Identifiants incorrects' });
        }

        const user = rows[0];

        // Vérification que le hash existe
        if (!user.password) {
            console.error('Aucun mot de passe trouvé pour l\'utilisateur');
            return res.status(500).json({ message: 'Erreur de configuration du compte' });
        }
        // Si la comparaison réussit
        const { password: _, ...userData } = user;
        req.session.user = userData;
        
        return res.json({ 
            message: 'Connecté',
            user: userData
        });
    } 
    catch (error) {
        console.error('Erreur login:', error);
        return res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Créer un nouvel utilisateur
userRouter.post('/signup', upload.single('profilePhoto'), async (req, res) => {
    const { firstname, lastname, email, password, country, city, privilege } = req.body;
    
    try {
        // Gérer le chemin de la photo
        const profilePhotoUrl = req.file 
            ? `/uploads/profiles/${req.file.filename}` 
            : null;
        const date = new Date()
        // Hacher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);
        const userRef = `USER_${date.getMilliseconds()}`
        
        // Requête SQL
        const [result] = await db.query(
            'INSERT INTO user (userRef, firstname, lastname, email, password, country, city, profilePhotoUrl, privilege, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
            [userRef, firstname, lastname, email, password, country, city, profilePhotoUrl, 'user']
        );
        
        // Récupérer l'utilisateur créé
        const [users] = await db.query(
            'SELECT * FROM user WHERE userRef = ?',
            [result.insertId]
        );
        // Route pour envoyer un email
        const to = users[0].email
        const subject = "Email Confirmation"
        const confirmationLink = "http://localhost:5173/confirmation?email=" + to
        const text = `Bienvenue sur notre plateforme !\n\nMerci de vous être inscrit. Veuillez confirmer votre adresse e-mail en cliquant sur le lien ci-dessous :\n\n${confirmationLink}`
        // Configuration de l'email

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
        };

        try {
            await transporter.sendMail(mailOptions);
            res.status(200).json({ message: 'Email envoyé avec succès' });
        } catch (error) {
            res.status(500).json({ error: 'Échec de l\'envoi de l\'email', details: error.message });
        };
        res.status(201).json({ 
            message: 'Utilisateur créé avec succès', 
            data: users[0] 
        });
        
    } catch (error) {
        // Supprimer le fichier uploadé si l'inscription échoue
        if (req.file) {
            try {
                const filePath = path.join(__dirname, '../../frontend/src/assets/uploads/profiles', req.file.filename);
                fs.unlinkSync(filePath);
            } catch (err) {
                console.error('Erreur lors de la suppression du fichier:', err);
            }
        }
        
        console.error('Erreur lors de la création:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }
        
        res.status(500).json({ message: error.message || 'Erreur serveur' });
    }
});

// Route pour modifier le mot de passe
userRouter.post('/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;
    const hash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE user SET password = ? WHERE email = ?', [newPassword, email]);
    res.json({ success: true });
});

  // Route pour modifier le profil
userRouter.put('/profile', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Non authentifié' })
    }

    try {
        // Mettez à jour les champs dans la session
        req.session.user.firstname = req.body.firstname
        req.session.user.lastname = req.body.lastname
        // ... autres champs
    
        // Mettez à jour la base de données
        await db.query(
            'UPDATE user SET firstname = ?, lastname = ? WHERE userRef = ?',
            [req.body.firstname, req.body.lastname, req.session.user.userRef]
        )
    
        res.json({ success: true, user: req.session.user })
        } catch (error) {
        console.error('Erreur mise à jour profil:', error)
        res.status(500).json({ message: 'Erreur serveur' })
        }
    })

// Obtenir tous les utilisateurs
userRouter.get('/users', async (req, res) => {
    try {
        const [users] = await db.query('SELECT firstname, lastname, email, country, city, profilePhotoUrl, privilege, createdAt FROM user');
        res.status(200).json({ 
            message: 'Utilisateurs récupérés avec succès', 
            data: users 
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Obtenir un utilisateur par ref
userRouter.get('/:ref', async (req, res) => {
    const userRef = req.params.ref;
    console.log('Entrée dans lendpoint get-usr avec: ', userRef)
    
    try {
        const [users] = await db.query(
            'SELECT userRef, firstname, lastname, email, country, city, profilePhotoUrl, privilege, createdAt FROM user WHERE userRef = ?',
            [userRef]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        
        res.status(200).json({ 
            message: 'Utilisateur récupéré avec succès', 
            data: users[0] 
        });
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Obtenir un utilisateur par email
userRouter.get('/:email', async (req, res) => {
    console.log("Entrée dans la route avec l'email:", req.params.email);
    const email = req.params.email;
    
    try {
        const [users] = await db.query(
            'SELECT * FROM user WHERE email = ?',
            [email]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        console.log(users[0])
        res.status(200).json({ 
            message: 'Utilisateur récupéré avec succès', 
            data: users[0] 
        });
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Route de déconnexion
userRouter.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Erreur lors de la déconnexion' });
        }
        res.clearCookie('connect.sid'); // Le nom du cookie peut varier
        res.status(200).json({ message: 'Déconnexion réussie' });
    });
});

export default userRouter;