import * as payrollHistory from '../controllers/payrollHistory.controller.js';
import express from 'express';

const router = express.Router();

router.get('/check', payrollHistory.checkExistingPayroll);

export default router;