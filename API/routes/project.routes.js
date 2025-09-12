import express from 'express';
import {
  createNewProject,
  fetchUserProjects,
  fetchAllProjects,
  fetchProjectByRef,
  updateProjectByRef,
  deleteProjectByRef
} from '../controllers/project.controller.js';

import { isAuthenticated } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/new-project', isAuthenticated, createNewProject);
router.get('/get-projects/:userRef', isAuthenticated, fetchUserProjects);
router.get('/all-projects', isAuthenticated, fetchAllProjects);
router.get('/:projectRef', isAuthenticated, fetchProjectByRef);
router.put('/:projectRef', isAuthenticated, updateProjectByRef);
router.delete('/:projectRef', isAuthenticated, deleteProjectByRef);

export default router;
