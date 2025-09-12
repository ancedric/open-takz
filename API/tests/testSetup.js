// tests/testSetup.js
import request from 'supertest';
import app from '../server.js'; // ou le bon chemin vers ton app
import pool from '../services/db.js'; // pour PostgreSQL

const agent = request.agent(app);

// Utilisateur de test global
const testUser = {
  username: 'testuser',
  email: 'testuser@example.com',
  password: 'password123',
};

export const setupTestUser = async () => {
  try {
    // Créer l'utilisateur
    await agent.post('/user/register').send(testUser);
  } catch (err) {
    // Ignorer l'erreur si déjà existant
  }

  // Se connecter
  await agent.post('/user/login').send({
    email: testUser.email,
    password: testUser.password,
  });

  return agent;
};

// Nettoyage optionnel de la base (tu peux le personnaliser)
export const cleanupDatabase = async () => {
  await pool.query('DELETE FROM collaborator');
  await pool.query('DELETE FROM assignments');
  await pool.query('DELETE FROM tasks');
  await pool.query('DELETE FROM projects');
  await pool.query('DELETE FROM teams');
  await pool.query('DELETE FROM users WHERE email = $1', [testUser.email]);
};
