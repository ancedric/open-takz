import express from 'express'
import {
  getEmployeByUserRef,
  getCompanyEmployees,
  createEmploye,
  updateEmploye,
  updatePrivilege,
  updateDepartment,
  getEmployees,
  getEmployeByRef,
  suppressEmploye
} from '../controllers/employe.controller.js';

import { isAuthenticated } from '../middlewares/auth.middleware.js';

const empRouter = express.Router();

// Routes
empRouter.get('/get-employe/:userref', isAuthenticated, getEmployeByUserRef);

// Password reset
empRouter.post('/new-employe', isAuthenticated, createEmploye);
empRouter.post('/update-employe', isAuthenticated, updateEmploye);
empRouter.put('/update-privilege', isAuthenticated, updatePrivilege);
empRouter.put('/update-department/:userref', isAuthenticated, updateDepartment)

// Admin / listing
empRouter.get('/employees', isAuthenticated, getEmployees);  
empRouter.get('/:ref', isAuthenticated, getEmployeByRef);
empRouter.get('/company/:companyref', isAuthenticated, getCompanyEmployees)

empRouter.delete('/delete-employe', suppressEmploye);

export default empRouter;