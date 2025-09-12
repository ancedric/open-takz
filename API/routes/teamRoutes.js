import express from 'express';
import db from '../services/mysqlConfig.js';

const teamRouter = express.Router();

// Créer une équipe pour un projet
// POST /api/teams - Créer une nouvelle équipe pour un projet
teamRouter.post('/:projectRef', async (req, res) => {
    const projectRef = req.params.projectRef;
    
        if (!projectRef) {
            return res.status(400).json({ error: 'ProjectRef is required' });
        }
    
        try {
            const teamRef = `TEAM_${Math.floor(Math.random() * 1000000)}`
        // 1. Créer l'équipe
        const [teamResult] = await db.query(
            'INSERT INTO team (teamRef, projectRef createdAt) VALUES (?, ?, NOW())',
            [teamRef, projectRef]
        );
    
        res.status(201).json({ 
            message: 'Équipe créée avec succès',
            data: teamResult
        });
    
        } catch (error) {
        console.error('Erreur création équipe:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    });

    //Récupérer l'équipe d'un projet
teamRouter.get('/project/:projectRef', async (req, res) => {
    const projectRef = req.params.projectRef;
        try {
        // 1. Récupérer l'équipe associée au projet
        const [teamResults] = await db.query(`
            SELECT * 
            FROM team
            WHERE projectRef = ?
        `, [projectRef]);
    
        if (teamResults.length === 0) {
            return res.status(404).json({ message: 'No team found for this project.' });
        }
    
        // 2. Récupérer les membres de l'équipe
        const [members] = await db.query(`
            SELECT *
            FROM collaborator
            WHERE teamRef = ?
        `, [teamResults[0].teamRef]);
            const t = teamResults[0]
            console.log('membres de la team: ', {t, members})
        res.status(200).json({ members});
    
        } catch (error) {
        console.error('Erreur récupération équipe:', error);
        res.status(500).json({ error: 'Erreur serveur' });
        }
    });

export default teamRouter;