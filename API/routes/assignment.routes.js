import express from 'express';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import {
  createAssignmentController,
  getAssignmentsByTaskController,
  deleteAssignmentController,
  checkAssignmentController,
  getTasksByCollaboratorController
} from '../controllers/assignment.controller.js';

const router = express.Router();

router.post('/new-assignment', isAuthenticated, createAssignmentController);
router.get('/get-assignments/:taskRef', isAuthenticated, getAssignmentsByTaskController);

// 🔥 Nouveaux endpoints
router.delete('/:assRef', isAuthenticated, deleteAssignmentController);
router.get('/check/:taskRef/:collabRef', isAuthenticated, checkAssignmentController);
router.get('/by-collab/:collabRef', isAuthenticated, getTasksByCollaboratorController);

export default router;
