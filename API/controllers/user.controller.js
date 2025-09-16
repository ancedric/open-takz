import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import {
  findUserByEmail,
  findUserByRef,
  createUser,
  updateUserPassword,
  updateUserProfile,
  getAllUsers
} from '../models/user.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Récupérer l'utilisateur courant depuis le token
export const getCurrentUser = (req, res) => {
  if (req.user) {
    const user = req.user;
    return res.json({
      valid: true,
      user: {
        id: user.userRef,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        profilePhotoUrl: user.profilePhotoUrl,
        privilege: user.privilege,
        city: user.city,
        country: user.country
      }
    });
  }
  res.json({ valid: false });
};

export const getSession = (req, res) => {
  if (req.user) {
    return res.json({
      authenticated: true,
      user: req.user
    });
  }
  res.json({ authenticated: false });
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe requis' });
  }

  try {
    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ message: 'Identifiants incorrects' });
    }

    if (!user.password) {
      return res.status(500).json({ message: 'Erreur de configuration du compte' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Identifiants incorrects' });
    }

    const { password: _, ...userData } = user;

    // Générer un token JWT
    const token = jwt.sign(
      { ...userData },
      process.env.JWT_SECRET, 
      { expiresIn: '1d' }
    );

    res.json({ message: 'Connecté', token, user: userData });

  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const signupUser = async (req, res) => {
  const { firstname, lastname, email, password, country, city, privilege } = req.body;
  let profilePhotoUrl = null;

  if (req.file) {
    profilePhotoUrl = `/uploads/profiles/${req.file.filename}`;
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const date = new Date();
    const userRef = `USER_${date.getTime()}`;

    const user = await createUser({
      userRef,
      firstname,
      lastname,
      email,
      password: hashedPassword,
      country,
      city,
      profilePhotoUrl,
      privilege: privilege || 'user'
    });

    // INotification de Bienvenue
    const mailOptions = {
      from: process.env.BREVO_SMTP_USER,
      to: email,
      subject: 'Bienvenue sur Open Task !',
      text: `Bonjour ${firstname},\n\nBienvenue sur Open Task ! Nous sommes ravis de vous compter parmi nous.\n\nCordialement,\nL'équipe Open Task`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Erreur envoi email:', error);
      } else {
        console.log('Email envoyé:', info.response);
      }
    });

    //Notification de Bienvenue
    const notifRef = `NOTIF_${Math.floor(Math.random() * 1000000)}`;
    const title = 'Bienvenue sur Open Task';
    const content = `Bonjour ${firstname}, bienvenue sur Open Task ! Nous sommes ravis de vous compter parmi nous.`;
    const newNotif = await createNotification(notifRef, title, content, userRef);
    console.log('Notification créée:', newNotif);

    res.status(201).json({ message: 'Utilisateur créé avec succès', data: user });

  } catch (error) {
    // Supprimer fichier uploadé si erreur
    if (req.file) {
      try {
        const filePath = path.join(__dirname, '../../frontend/src/assets/uploads/profiles', req.file.filename);
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Erreur suppression fichier:', err);
      }
    }

    if (error.code === '23505') {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    console.error('Erreur création utilisateur:', error);
    res.status(500).json({ message: error.message || 'Erreur serveur' });
  }
};

export const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ message: 'Email et nouveau mot de passe requis' });
  }
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUser = await updateUserPassword(email, hashedPassword);
    if (!updatedUser) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur reset password:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const updateProfile = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Non authentifié' });
  }
  const { firstname, lastname, country, city } = req.body;

  try {
    const updatedUser = await updateUserProfile(req.user.userRef, { firstname, lastname, country, city });
    const mergedUser = { ...req.user, ...updatedUser };

    // On renvoie le nouvel utilisateur (le token actuel reste valide mais les infos ont changé)
    res.json({ success: true, user: mergedUser });
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await getAllUsers();
    res.status(200).json({ message: 'Utilisateurs récupérés avec succès', data: users });
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const getUserByRef = async (req, res) => {
  const userRef = req.params.userref;
  try {
    const user = await findUserByRef(userRef);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.status(200).json({ message: 'Utilisateur récupéré avec succès', data: user });
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const getUserByEmail = async (req, res) => {
  const email = req.params.email;
  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.status(200).json({ message: 'Utilisateur récupéré avec succès', data: user });
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Pour JWT, la "déconnexion" côté serveur ne supprime rien : c’est côté client qu’on efface le token
export const logoutUser = (req, res) => {
  res.status(200).json({ message: 'Déconnexion réussie (supprimez le token côté client)' });
};
