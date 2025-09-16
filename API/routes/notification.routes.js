import express from 'express';
import {
    createNotificationController,
    getAllNotificationsController,
    getNotificationsByUserController,
    getNotificationByRefController,
    updateNotificationStatusController,
    deleteNotificationController
} from '../controllers/notification.controller.js';

const notificationsRouter = express.Router();

notificationsRouter.post('/new-notif', createNotificationController);
notificationsRouter.get('/all', getAllNotificationsController);
notificationsRouter.get('/user-notifs/:userRef', getNotificationsByUserController);
notificationsRouter.get('/get/:ref', getNotificationByRefController);
notificationsRouter.put('/update-status/:Ref', updateNotificationStatusController);
notificationsRouter.delete('/delete/:ref', deleteNotificationController);

export default notificationsRouter;