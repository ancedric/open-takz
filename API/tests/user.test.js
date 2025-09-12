// tests/user.test.js
import { setupTestUser, cleanupDatabase } from './testSetup.js';

describe('User Routes', () => {
  let agent;

  beforeAll(async () => {
    agent = await setupTestUser();
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  it('should register a new user', async () => {
    const res = await agent.post('/user/register').send({
      username: 'anotheruser',
      email: 'anotheruser@example.com',
      password: 'securepassword',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message', 'Utilisateur enregistré avec succès');
  });

  it('should not register a user with existing email', async () => {
    const res = await agent.post('/user/register').send({
      username: 'duplicateuser',
      email: 'testuser@example.com', // déjà utilisé dans setupTestUser
      password: 'password123',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should login an existing user', async () => {
    const res = await agent.post('/user/login').send({
      email: 'testuser@example.com',
      password: 'password123',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe('testuser@example.com');
  });

  it('should fail login with wrong password', async () => {
    const res = await agent.post('/user/login').send({
      email: 'testuser@example.com',
      password: 'wrongpassword',
    });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('should get current user session', async () => {
    const res = await agent.get('/user/me');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('email', 'testuser@example.com');
  });

  it('should logout user', async () => {
    const res = await agent.post('/user/logout');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Déconnexion réussie');
  });

  it('should return 401 after logout when accessing /user/me', async () => {
    const res = await agent.get('/user/me');
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'Non authentifié');
  });
});
