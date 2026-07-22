import * as method from '../controllers/paymentMethod.controller.js';
import express from 'express';
import { isAuthenticated } from '../middlewares/auth.middleware.js';

const methodRouter = express.Router();

methodRouter.get('/company/:companyref', isAuthenticated, method.getCompanyPaymentMethod);

export default methodRouter;