import express from 'express';
import db from '../services/mysqlConfig.js'

const notificationsRouter = express.Router();

// Créer une nouvelle notification
notificationsRouter.post('/new-notif', async (req, res) => {
    const {title, content, userRef}= req.body;
    const notifRef = `NOTIF_${Math.floor(Math.random()* 1000000)}`

    const sql = 'INSERT INTO notification (notifRef, title, content, userRef) VALUES(?, ?, ?, ?)'

    try{
        await db.query(sql, [notifRef, title, content, userRef])

        return res.status(201).json({
            message:'Notification créée avec succès.'
        })
    }catch(err){
        console.error('Reereur lors de la création de la notification: ', err)
    }
});

// Obtenir toutes les notifications
notificationsRouter.get('/all', async (req, res) => {
    const sql = 'SELECT * FROM notification'
    
    const [results] = await db.query(sql)
    if(results.length === 0){
        console.log("Aucune notification.")
        return []
    }
    return res.status(200).json({
        message: 'Notifications récupérées avec succès.',
        data: results
    })
});

// Obtenir toutes les notifications d'un utilisateur
notificationsRouter.get('/user-notifs/:userRef', async (req, res) => {
    const userRef = req.params.userRef
    const sql = 'SELECT * FROM notification WHERE userRef = ?'
    
    const [results] = await db.query(sql, [userRef])
    if(results.length === 0){
        console.log("Aucune notification pour cet utilisateur.")
        return []
    }
    return res.status(200).json({
        message: 'Notifications récupérées avec succès.',
        data: results
    })
});

// Obtenir une notification par son Ref
notificationsRouter.get('/get/:ref', async (req, res) => {
    const notifRef = req.params.ref
    const sql = 'SELECT * FROM notification WHERE notifRef = ?'
    
    const [results] = await db.query(sql, [notifRef])
    if(results.length === 0){
        console.log("Aucune notification.")
        return []
    }
    return res.status(200).json({
        message: 'Notifications récupérées avec succès.',
        data: results
    })
});

// Mettre à jour l'e statut d'une notification
notificationsRouter.put('/update-status/:Ref', async (req, res) => {
    const notifRef = req.params.Ref
    const newStatus = req.body
    const sql = 'UPDATE notification SET status VALUES(?) WHERE notifRef = ?'

    try{
        await db.query(sql, [newStatus, notifRef])

        return res.status(201).json({
            message:'Notification créée avec succès.'
        })
    }catch(err){
        console.error('Reereur lors de la création de la notification: ', err)
    }
});

// Supprimer une commande
notificationsRouter.delete('/delete/:ref', async (req, res) => {
    const notifRef = req.params.ref
    const sql = 'DELETE * FROM notification WHERE notifRef = ?'

    try{
        await db.query(sql, [notifRef])

        return res.status(201).json({
            message:'Notification supprimée avec succès.'
        })
    }catch(err){
        console.error('Reereur lors de la suppression de la notification: ', err)
    }
});

export default notificationsRouter;