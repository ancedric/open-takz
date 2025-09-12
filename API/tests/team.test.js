// tests/team.test.js
import { setupTestUser, cleanupDatabase } from './testSetup.js';

describe('Team Routes', () => {
  let agent;
  let createdTeamRef;

  beforeAll(async () => {
    agent = await setupTestUser();
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  it('should create a new team', async () => {
    const res = await agent.post('/team/new-team').send({
      name: 'Dev Team'
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message', 'Équipe créée avec succès');
    expect(res.body).toHaveProperty('teamRef');
    createdTeamRef = res.body.teamRef;
  });

  it('should return 400 if name is missing', async () => {
    const res = await agent.post('/team/new-team').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should get all teams', async () => {
    const res = await agent.get('/team/get-all');
    expect([200, 404]).toContain(res.statusCode);

    if (res.statusCode === 200) {
      expect(Array.isArray(res.body)).toBe(true);
    } else {
      expect(res.body).toHaveProperty('message', 'Aucune équipe trouvée');
    }
  });
});
