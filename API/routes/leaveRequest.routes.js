import express from 'express';
import * as leave from '../controllers/leaveRequest.controller.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/all', isAuthenticated, leave.getAllRequests);
router.get('/company/:companyref', isAuthenticated, leave.getCompanyRequests);
router.get('/user/:employeeId', isAuthenticated, leave.getUserRequests);
router.get('/approved/:companyref', isAuthenticated, leave.getApprovedRequests);
router.get('/pending/:companyref', isAuthenticated, leave.getPendingRequests);
router.put('/update-status/:id', isAuthenticated, leave.updateRequestStatus);
router.delete('/user/:ref', isAuthenticated, leave.cancelRequest);
router.post('/new', isAuthenticated, leave.newRequest);

export default router;