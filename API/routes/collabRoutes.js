import express from 'express';
import db from '../services/mysqlConfig.js';

const collabRouter = express.Router();

// Ajouter un collaborateur à une équipe
collabRouter.post('/new-collab', async (req, res) => {
    const { userRef, teamRef } = req.body;

    if (!userRef || !teamRef) {
        return res.status(400).json({ error: 'userRef and teamRef are required' });
    }

    try {
        // Vérifier si l'utilisateur existe
        const [user] = await db.query('SELECT userRef FROM users WHERE id = ?', [userRef]);
        if (user.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        // Vérifier si l'équipe existe
        const [team] = await db.query('SELECT teamRef FROM teams WHERE id = ?', [teamRef]);
        if (team.length === 0) {
            return res.status(404).json({ error: 'Équipe non trouvée' });
        }

        // Ajouter le collaborateur
        const collabRef = `COLLAB_${Math.floor(Math.random() * 1000000)}`
        const [result] = await db.query(
            'INSERT INTO collaborator (collabRef, userRef, teamRef) VALUES (?, ?, ?)',
            [collabRef, userRef, teamRef]
        );

        res.status(201).json({ 
            message: 'Collaborateur ajouté avec succès',
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Cet utilisateur est déjà membre de l\'équipe' });
        }
        console.error('Erreur ajout collaborateur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Récupérer tous les collaborateurs d'une équipe
collabRouter.get('/get-members/:teamRef', async (req, res) => {
    const teamRef = req.params.teamRef;

    try {
        const [collaborators] = await db.query(`
            SELECT *
            FROM collaborator
            WHERE teamRef = ?
        `, [teamRef]);

        if (collaborators.length === 0) {
            return res.status(404).json({ message: 'No collaborator found in this team.' });
        }

        res.status(200).json(collaborators);

    } catch (error) {
        console.error('Erreur récupération collaborateurs:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
// Récupérer un collaborateur par sa Ref
collabRouter.get('/get-collaborator/:collabRef', async (req, res) => {
    const collabRef = req.params.collabRef;
    console.log("Entrée dans l'endpoint get-collab avec: ", collabRef)

    try {
        const [collaborators] = await db.query('SELECT * FROM collaborator WHERE collabRef = ?', [collabRef]);

        if (collaborators.length === 0) {
            return res.status(404).json({ message: 'No collaborator found in this team.' });
        }

        res.status(200).json(collaborators[0]);

    } catch (error) {
        console.error('Erreur récupération collaborateurs:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

/*collabRouter.get('/get-collab/:collabRef', async (req, res) => {
    const collabRef = req.params.collabRef;
    console.log("Entrée dans l'endpoint get-collab avec: ", collabRef)

    try {
        const [collaborators] = await db.query(`
            SELECT *
            FROM collaborator
            WHERE collabRef = ?
        `, [collabRef]);

        if (collaborators.length === 0) {
            return res.status(404).json({ message: 'No collaborator found in this team.' });
        }

        res.status(200).json(collaborators[0]);

    } catch (error) {
        console.error('Erreur récupération du collaborateur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});*/

// Mettre à jour le rôle d'un collaborateur
collabRouter.put('/update-role/:collabRef', async (req, res) => {
    const collabRef = req.params.collabRef;
    const { role } = req.body;

    if (!role) {
        return res.status(400).json({ error: 'Le nouveau rôle est requis' });
    }

    try {
        const [result] = await db.query(
            'UPDATE collaborator SET role = ? WHERE collabRef = ?',
            [role, collabRef]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Collaborateur non trouvé' });
        }

        res.status(200).json({ message: 'Rôle mis à jour avec succès' });

    } catch (error) {
        console.error('Erreur mise à jour rôle:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Supprimer un collaborateur d'une équipe
collabRouter.delete('/delete-collab/:collabRef', async (req, res) => {
    const collabRef = req.params.collabRef;

    try {
        const [result] = await db.query(
            'DELETE FROM collaborator WHERE collabRef = ?',
            [collabRef]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Collaborateur non trouvé' });
        }

        res.status(200).json({ message: 'Collaborateur supprimé avec succès' });

    } catch (error) {
        console.error('Erreur suppression collaborateur:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default collabRouter;