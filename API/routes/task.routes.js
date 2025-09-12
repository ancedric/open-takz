// routes/task.routes.js
import express from 'express';
import upload from '../services/multerConfig.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import {
  createTaskController,
  getTasksByProjectController,
  getAllTasksController,
  getTaskByRefController,
  updateTaskController,
  updateTaskStatusController,
  deleteTaskController
} from '../controllers/task.controller.js';

const router = express.Router();

router.post('/new-task', isAuthenticated, upload.none(), createTaskController);
router.get('/get-tasks/:projectRef', isAuthenticated, getTasksByProjectController);
router.get('/all-tasks', isAuthenticated, getAllTasksController);
router.get('/:taskRef', isAuthenticated, getTaskByRefController);
router.put('/:taskRef', isAuthenticated, updateTaskController);
router.put('/set-status/:taskRef', isAuthenticated, updateTaskStatusController);
router.delete('/:taskRef', isAuthenticated, deleteTaskController);

export default router;
