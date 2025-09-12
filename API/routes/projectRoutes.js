import express from 'express';
import db from '../services/mysqlConfig.js';
import upload from '../services/multerConfig.js'

const projectRouter = express.Router();

// Créer un nouveau projet
projectRouter.post('/new-project', upload.none(), async (req, res) => {
    try {
        // Vérification des champs requis
        if (!req.body.name || !req.body.userRef) {
        return res.status(400).json({ error: 'Missing required fields' });
        }

        const now = new Date().toLocaleString();
        const projectRef = `PROJ-${Math.floor(Math.random() * 1000000)}`;
        
        const sql = `
            INSERT INTO project 
            (projectRef, projectName, userRef, projectDesc, projectType, projectCible, projectStart, createdAt) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const values = [
            projectRef,
            req.body.name,
            req.body.userRef,
            req.body.description || null,
            req.body.type || null,
            req.body.objectives || null,
            req.body.start_date || null,
            now
        ];

        const [result] = await db.query(sql, values);
        if (result.affectedRows === 0) {
            console.log('No rows affected');
            return res.status(500).json({ 
                error: 'Project creation failed' 
            });
        }
        const teamRef = `TEAM-${Math.floor(Math.random() * 1000000)}`;
        const teamReq = `
            INSERT INTO team 
            (teamRef, projectRef, createdAt) 
            VALUES ( ?, ?, ?)
        `;
        const [teamRes] = await db.query(teamReq, [teamRef, projectRef, now]);
        if (teamRes.affectedRows === 0) {
            console.log('No team rows affected');
            return res.status(500).json({ 
                error: 'team creation failed' 
            });
        }

        const collabRef = `COLLAB-${Math.floor(Math.random() * 1000000)}`;
        const request = `
            INSERT INTO collaborator 
            (collabRef, userRef, teamRef, role) 
            VALUES ( ?, ?, ?, ?)
        `;
        const [colabResult] = await db.query(request, [collabRef, req.body.userRef, teamRef, 'Project Manager']);
        if (colabResult.affectedRows === 0) {
            console.log('No team rows affected');
            return res.status(500).json({ 
                error: 'team creation failed' 
            });
        }
        console.log('Project created successfully')
        res.status(201).json({ 
            message: 'Project created successfully', 
            projectId: result.insertId,
            projectRef: projectRef
        });

    } catch (error) {
            console.error('Error creating project:', error);
            res.status(500).json({ 
                error: 'Database error',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
    }
    });

// Obtenir tous les projets d'un utilisateur avec équipes et membres détaillés
projectRouter.get('/get-projects/:userRef', async (req, res) => {
    try {
        const userRef = req.params.userRef;
        
        // 1. Récupération des projets de base avec jointure pour l'équipe
        const [projects] = await db.query(`
            SELECT 
                *
            FROM 
                project
            WHERE 
                userRef = ? 
            ORDER BY 
                createdAt DESC
        `, [userRef]);

        if (projects.length === 0) {
            return res.status(200).json({ 
                message: 'No projects found',
                data: []
            });
        }

        res.status(200).json({
            message: 'Projects fetched successfully',
            data: projects
        });

    } catch (error) {
        console.error("Error fetching projects:", error);
        res.status(500).json({ 
            error: 'Database error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Obtenir tous les projets
projectRouter.get('/all-projects', async (req, res) => {
    try {
        const [projects] = await db.query(
            "SELECT * FROM project ORDER BY createdAt DESC"
        );

        if (projects.length === 0) {
            return res.status(200).json({ 
                message: 'No projects found',
                data: []
            });
        }

        console.log('Fetched all projects:', projects.length);
        res.status(200).json({
            message: 'Projects fetched successfully',
            data: projects
        });

    } catch (error) {
        console.error("Error fetching all projects:", error);
        res.status(500).json({ 
            error: 'Database error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Obtenir un projet par Ref
projectRouter.get('/:projectRef', async (req, res) => {
    try {
        const projectRef = req.params.projectRef;
        const [projects] = await db.query(
            "SELECT * FROM project WHERE projectRef = ?", 
            [projectRef]
        );

        if (projects.length === 0) {
            return res.status(404).json({ 
                error: 'Project not found' 
            });
        }

        res.status(200).json({
            message: 'Project fetched successfully',
            data: projects[0]
        });

    } catch (error) {
        console.error('Error getting project:', error);
        res.status(500).json({ 
            error: 'Database error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Mettre à jour un projet
projectRouter.put('/:projectRef', async (req, res) => {
    try {
        const projectRef = req.params.projectRef;
        const updates = req.body;
        
        // Construction dynamique de la requête UPDATE
        let updateFields = [];
        let values = [];
        
        for (const [key, value] of Object.entries(updates)) {
            // Ne pas mettre à jour certains champs
            if (!['projectRef', 'userRef', 'createdAt'].includes(key)) {
                updateFields.push(`${key} = ?`);
                values.push(value);
            }
        }
        
        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }
        
        values.push(projectRef); // Pour le WHERE
        
        const sql = `
            UPDATE project 
            SET ${updateFields.join(', ')} 
            WHERE projectRef = ?
        `;
        
        const [result] = await db.query(sql, values);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        // Récupérer le projet mis à jour
        const [updatedProject] = await db.query(
            "SELECT * FROM project WHERE projectRef = ?", 
            [projectRef]
        );
        
        res.status(200).json({
            message: 'Project updated successfully',
            data: updatedProject[0]
        });

    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ 
            error: 'Database error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Supprimer un projet
projectRouter.delete('/:projectRef', async (req, res) => {
    try {
        const projectRef = req.params.projectRef;
        
        // D'abord vérifier si le projet existe
        const [check] = await db.query(
            "SELECT projectRef FROM project WHERE projectRef = ?", 
            [projectRef]
        );
        
        if (check.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        // Supprimer le projet
        const [result] = await db.query(
            "DELETE FROM project WHERE projectRef = ?", 
            [projectRef]
        );
        
        res.status(204).send();

    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ 
            error: 'Database error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

export default projectRouter;