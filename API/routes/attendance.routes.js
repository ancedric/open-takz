import express from 'express';
import * as attendance from '../controllers/attendance.controller.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/all', isAuthenticated, attendance.getAllAttendances);
router.get('/company/:companyref', isAuthenticated, attendance.getCompanyAttendance);
router.get('/user/:userref', isAuthenticated, attendance.getUserAttendance);
router.get('/company/today/:companyref/:date', isAuthenticated, attendance.getTodayAttendance);
router.post('/new', isAuthenticated, attendance.newAttendance);
router.put('/check-out/:id', isAuthenticated, attendance.checkOut)

export default router;