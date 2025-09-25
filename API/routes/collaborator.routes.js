import express from 'express';
import {
  addCollaborator,
  getTeamMembers,
  getCollaborator,
  updateRole,
  deleteCollaborator,
  getCollabUser,
} from '../controllers/collaborator.controller.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/new-collab', isAuthenticated, addCollaborator);
router.get('/get-members/:teamRef', isAuthenticated, getTeamMembers);
router.get('/get-collab-user/:userref', isAuthenticated, getCollabUser);
router.get('/get-collaborator/:collabRef', isAuthenticated, getCollaborator);
router.put('/update-role/:collabRef', isAuthenticated, updateRole);
router.delete('/delete-collab/:collabRef', isAuthenticated, deleteCollaborator);

export default router;
