// tests/assignment.test.js
import { setupTestUser, cleanupDatabase } from './testSetup.js';

describe('Assignment Routes', () => {
  let agent;
  let createdTaskId;
  let createdUserId;
  let assignmentId;

  beforeAll(async () => {
    agent = await setupTestUser();

    // Créer une tâche à assigner
    const taskRes = await agent.post('/task/new-task').send({
      title: 'Task to Assign',
      description: 'Test assignment',
      status: 'pending',
      projectId: 1 // Vous pouvez ajuster selon un projet valide
    });

    createdTaskId = taskRes.body.taskId;

    // Récupérer l’ID utilisateur depuis la session
    const userRes = await agent.get('/user/profile');
    createdUserId = userRes.body.id;
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  it('should assign a task to a user', async () => {
    const res = await agent.post('/assignment/assign-task').send({
      taskId: createdTaskId,
      userId: createdUserId
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message', 'Tâche assignée avec succès');
    assignmentId = res.body.assignmentId;
  });

  it('should return 400 for missing fields', async () => {
    const res = await agent.post('/assignment/assign-task').send({
      taskId: null,
      userId: null
    });

    expect(res.statusCode).toBe(400);
  });

  it('should return 404 if task or user not found', async () => {
    const res = await agent.post('/assignment/assign-task').send({
      taskId: 99999,
      userId: 99999
    });

    expect(res.statusCode).toBe(404);
  });
});
