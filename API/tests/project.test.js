// tests/project.test.js
import { setupTestUser, cleanupDatabase } from './testSetup.js';

describe('Project Routes', () => {
  let agent;
  let createdProjectId;

  beforeAll(async () => {
    agent = await setupTestUser();
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  it('should create a new project', async () => {
    const res = await agent.post('/project/new-project').send({
      name: 'Test Project',
      description: 'Project for testing',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('projectId');
    createdProjectId = res.body.projectId;
  });

  it('should get all projects', async () => {
    const res = await agent.get('/project/get-all');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should get a project by ID', async () => {
    const res = await agent.get(`/project/get-project/${createdProjectId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', createdProjectId);
    expect(res.body).toHaveProperty('name', 'Test Project');
  });

  it('should update a project', async () => {
    const res = await agent.put(`/project/update-project/${createdProjectId}`).send({
      name: 'Updated Project',
      description: 'Updated description',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Projet mis à jour avec succès');
  });

  it('should delete a project', async () => {
    const res = await agent.delete(`/project/delete-project/${createdProjectId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Projet supprimé avec succès');
  });
});
