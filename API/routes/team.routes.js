// routes/team.routes.js
import express from 'express';
import {
  createTeamForProject,
  getTeamAndMembers,
  getTeamFromCollab
} from '../controllers/team.controller.js';

import { isAuthenticated } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/:projectRef', isAuthenticated, createTeamForProject);
router.get('/project/:projectRef', isAuthenticated, getTeamAndMembers);
router.get('/collab/:collabRef', isAuthenticated, getTeamAndMembers);
router.get('/get-team-collab/:teamRef', isAuthenticated, getTeamFromCollab);

export default router;
