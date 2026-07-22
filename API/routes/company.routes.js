import express from 'express';
import {
  createNewCompany,
  fetchAllCompanies,
  fetchCompanyByRef,
  updateCompanyByRef,
  deleteCompanyByRef
} from '../controllers/company.controller.js';
import upload from '../services/multerConfig.js';

import { isAuthenticated } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/new-company', isAuthenticated,  upload.single('file'), createNewCompany);
router.get('/all-companies', isAuthenticated, fetchAllCompanies);
router.get('/:companyRef', isAuthenticated, fetchCompanyByRef);
router.put('/:companyRef', isAuthenticated, updateCompanyByRef);
router.delete('/:companyRef', isAuthenticated, deleteCompanyByRef);

export default router;
