import express from 'express';
import db from '../services/mysqlConfig.js';

const assignmentRouter = express.Router();

// 📌 Créer une assignation d'un utilisateur à une tâche
assignmentRouter.post('/new-assignment', async (req, res) => {
    const { collabRef, taskRef } = req.body;

    if (!collabRef || !taskRef) {
        return res.status(400).json({ error: 'collabRef and taskRef are required.' });
    }

    try {
        const assignRef = `ASSIGN_${Math.floor(Math.random() * 1000000)}`
        const [result] = await db.query(
            'INSERT INTO assignment (assRef, collabRef, taskRef, dateAssigned) VALUES (?, ?, ?, NOW())',
        [assignRef, collabRef, taskRef]
        );

        res.status(201).json({
            message: 'Utilisateur assigné à la tâche avec succès.',
            data: result
        });
    } catch (error) {
        console.error('Erreur lors de la création de l\'assignation:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// 📌 Récupérer les assignations d’une tâche donnée
assignmentRouter.get('/get-assignments/:taskRef', async (req, res) => {
    const { taskRef } = req.params;

    try {
        const [results] = await db.query(
            `SELECT *
             FROM assignment 
             WHERE taskRef = ?`,
            [taskRef]
        );

        if(results.length === 0){
            return[]
        }
        console.log("assignments: ", results)
        res.status(200).json({
            message: 'Assignations récupérées avec succès.',
            data: results
        });
    } catch (error) {
        console.error('Erreur récupération des assignations:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default assignmentRouter;
