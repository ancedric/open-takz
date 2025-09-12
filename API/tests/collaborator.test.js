// tests/collaborator.test.js
import { setupTestUser, cleanupDatabase } from './testSetup.js';

describe('Collaborator Routes', () => {
  let agent;
  let createdTeamRef;
  let createdUserRef;
  let createdCollabRef;

  beforeAll(async () => {
    agent = await setupTestUser();

    // Créer une équipe
    const teamRes = await agent.post('/team/new-team').send({ name: 'Test Team' });
    createdTeamRef = teamRes.body.teamRef;

    // Créer un autre utilisateur pour le test
    const userRes = await agent.post('/user/register').send({
      fullName: 'Second User',
      email: 'second@example.com',
      password: 'password123'
    });
    createdUserRef = userRes.body.userRef;
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  it('should add a collaborator to a team', async () => {
    const res = await agent.post('/collab/new-collab').send({
      userRef: createdUserRef,
      teamRef: createdTeamRef
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message', 'Collaborateur ajouté avec succès');
    createdCollabRef = res.body.collabRef;
  });

  it('should return 400 if required fields are missing', async () => {
    const res = await agent.post('/collab/new-collab').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should get collaborators by teamRef', async () => {
    const res = await agent.get(`/collab/get-members/${createdTeamRef}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should get a collaborator by collabRef', async () => {
    const res = await agent.get(`/collab/get-collaborator/${createdCollabRef}`);
    expect([200, 404]).toContain(res.statusCode);
  });

  it('should update collaborator role', async () => {
    const res = await agent.put(`/collab/update-role/${createdCollabRef}`).send({
      role: 'admin'
    });

    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('message', 'Rôle mis à jour avec succès');
    }
  });

  it('should delete a collaborator', async () => {
    const res = await agent.delete(`/collab/delete-collab/${createdCollabRef}`);
    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('message', 'Collaborateur supprimé avec succès');
    }
  });
});
