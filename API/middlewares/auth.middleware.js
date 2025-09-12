// middlewares/auth.middleware.js
import jwt from 'jsonwebtoken';

export const isAuthenticated = (req, res, next) => {
  const authHeader = req.headers['authorization']; // "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token manquant' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Token invalide' });
    }
    req.user = decoded; // On attache les infos du user (contenues dans le token)
    next();
  });
};
