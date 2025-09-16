import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  getCurrentUser,
  loginUser,
  signupUser,
  resetPassword,
  updateProfile,
  getUsers,
  getUserByRef,
  getUserByEmail,
  logoutUser
} from '../controllers/user.controller.js';

import { isAuthenticated } from '../middlewares/auth.middleware.js';

const userRouter = express.Router();

// Setup multer storage
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../frontend/src/assets/uploads/profiles'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// Routes

// Auth & user info
userRouter.get('/', isAuthenticated, getCurrentUser);   // récupère l'utilisateur courant à partir du token
userRouter.post('/login', loginUser);
userRouter.post('/signup', upload.single('profilePhoto'), signupUser);

// Password reset
userRouter.post('/reset-password', resetPassword);

// Update profile (protégé)
userRouter.put('/profile', isAuthenticated, updateProfile);

// Admin / listing
userRouter.get('/users', isAuthenticated, getUsers);     // optionnellement protégé
userRouter.get('/:ref', isAuthenticated, getUserByRef);  // idem
userRouter.get('/email/:email', isAuthenticated, getUserByEmail); // idem

// Déconnexion → côté client uniquement (supprimer le token)
userRouter.post('/logout', logoutUser); // en JWT, ça peut juste dire "token côté client supprimé"

export default userRouter;
