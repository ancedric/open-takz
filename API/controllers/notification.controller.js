// controllers/notification.controller.js
import {
    createNotification,
    getAllNotifications,
    getNotificationsByUser,
    getNotificationByRef,
    updateNotificationStatus,
    deleteNotification
} from '../models/notification.model.js';

// Créer une nouvelle notification
export const createNotificationController = async (req, res) => {
    const { title, content, userRef } = req.body;
    if (!title || !content || !userRef) {
        return res.status(400).json({ error: 'Titre, contenu et utilisateur sont requis.' });
    }
    const notifRef = `NOTIF_${Math.floor(Math.random() * 1000000)}`;

    try {
        const result = await createNotification(notifRef, title, content, userRef);
        res.status(201).json({
            message: 'Notification créée avec succès.',
            data: result
        });
    } catch (err) {
        console.error('Erreur lors de la création de la notification:', err);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
};

// Obtenir toutes les notifications
export const getAllNotificationsController = async (req, res) => {
    try {
        const notifications = await getAllNotifications();
        res.status(200).json({
            message: 'Notifications récupérées avec succès.',
            data: notifications
        });
    } catch (err) {
        console.error('Erreur lors de la récupération des notifications:', err);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
};

// Obtenir les notifications d'un utilisateur
export const getNotificationsByUserController = async (req, res) => {
    const userRef = req.params.userRef;
    try {
        const notifications = await getNotificationsByUser(userRef);
        res.status(200).json({
            message: 'Notifications récupérées avec succès.',
            data: notifications
        });
    } catch (err) {
        console.error('Erreur lors de la récupération des notifications de l\'utilisateur:', err);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
};

// Obtenir une notification par son Ref
export const getNotificationByRefController = async (req, res) => {
    const notifRef = req.params.ref;
    try {
        const notification = await getNotificationByRef(notifRef);
        if (!notification) {
            return res.status(404).json({ message: 'Notification non trouvée.' });
        }
        res.status(200).json({
            message: 'Notification récupérée avec succès.',
            data: notification
        });
    } catch (err) {
        console.error('Erreur lors de la récupération de la notification:', err);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
};

// Mettre à jour le statut d'une notification
export const updateNotificationStatusController = async (req, res) => {
    const notifRef = req.params.Ref;
    const { isRead } = req.body;
    try {
        const updatedNotification = await updateNotificationStatus(notifRef, isRead);
        if (!updatedNotification) {
            return res.status(404).json({ message: 'Notification non trouvée.' });
        }
        res.status(200).json({
            message: 'Statut de la notification mis à jour.',
            data: updatedNotification
        });
    } catch (err) {
        console.error('Erreur lors de la mise à jour du statut:', err);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
};

// Supprimer une notification
export const deleteNotificationController = async (req, res) => {
    const notifRef = req.params.ref;
    try {
        const deletedCount = await deleteNotification(notifRef);
        if (deletedCount === 0) {
            return res.status(404).json({ message: 'Notification non trouvée.' });
        }
        res.status(200).json({
            message: 'Notification supprimée avec succès.'
        });
    } catch (err) {
        console.error('Erreur lors de la suppression de la notification:', err);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
};