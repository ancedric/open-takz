// tests/task.test.js
import { setupTestUser, cleanupDatabase } from './testSetup.js';

describe('Task Routes', () => {
  let agent;
  let createdProjectId;
  let createdTaskId;

  beforeAll(async () => {
    agent = await setupTestUser();

    // Créer un projet pour y associer les tâches
    const projectRes = await agent.post('/project/new-project').send({
      name: 'Project For Task',
      description: 'To test tasks',
    });

    createdProjectId = projectRes.body.projectId;
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  it('should create a new task', async () => {
    const res = await agent.post('/task/new-task').send({
      title: 'Test Task',
      description: 'Testing task route',
      status: 'pending',
      projectId: createdProjectId,
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('taskId');
    createdTaskId = res.body.taskId;
  });

  it('should get all tasks', async () => {
    const res = await agent.get('/task/get-all');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should get a task by ID', async () => {
    const res = await agent.get(`/task/get-task/${createdTaskId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', createdTaskId);
  });

  it('should update a task', async () => {
    const res = await agent.put(`/task/update-task/${createdTaskId}`).send({
      title: 'Updated Task',
      status: 'completed',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Tâche mise à jour avec succès');
  });

  it('should delete a task', async () => {
    const res = await agent.delete(`/task/delete-task/${createdTaskId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Tâche supprimée avec succès');
  });
});
