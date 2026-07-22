import express from 'express';
import * as department from '../controllers/department.controller.js';

const departmentRoutes = express.Router();
    
departmentRoutes.post('/create-default-departments', department.createDefaultDepartments);
departmentRoutes.get('/get-departments/:companyref', department.getDepartmentsByCompanyRef);


export default departmentRoutes;