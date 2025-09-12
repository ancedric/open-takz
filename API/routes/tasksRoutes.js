import express from 'express';
import db from '../services/mysqlConfig.js';
import upload from '../services/multerConfig.js'

const taskRouter = express.Router();

taskRouter.post('/new-task', upload.none(), async (req, res) => {
    try {
        // Validation des champs requis
        if (!req.body.taskName || !req.body.projectRef) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['taskName', 'projectRef']
            });
        }
        const taskRef = `TASK_${Math.floor(Math.random() * 1000000)}`;
        
        const sql = `
            INSERT INTO task 
            (taskRef, taskName, startDate, endDate, status, projectRef) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        const values = [
            taskRef,
            req.body.taskName,
            req.body.taskStart || null, // Permet les valeurs nulles
            req.body.taskEnd || null,
            req.body.status || 'ongoing', // Valeur par défaut
            req.body.projectRef
        ];
        
        const [result] = await db.query(sql, values);
        
        if (result.affectedRows === 0) {
            console.log('No rows affected');
            return res.status(500).json({ 
                error: 'Task creation failed' 
            });
        }

        
        return res.status(201).json({ 
            message: 'Task created successfully', 
            taskId: result.insertId,
            taskRef: taskRef,
            projectRef: req.body.projectRef
        });

    } catch (error) {
        console.error('Error creating task:', error);
        return res.status(500).json({ 
            error: 'Database error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Obtenir toutes les tâches d'un projet
taskRouter.get('/get-tasks/:projectRef', async (req, res) => {
    try {
        const projectRef = req.params.projectRef;
        const [tasks] = await db.query(
            "SELECT * FROM task WHERE projectRef = ?", 
            [projectRef]
        );

        if (tasks.length === 0) {
            return res.status(200).json({ 
                message: 'No tasks found',
                data: []
            });
        }

        // Récupérer les sous-tâches associées aux tâches
        /*const subtasks = await db.query(
            "SELECT * FROM subtask WHERE taskRef IN (?)",
            [tasks.map(task => task.taskRef)]
        )
        if(subtasks.length === 0) {
            tasks.forEach(task => {
                task.subtasks = [];
            });
        } else {
            tasks.forEach(task => {
                task.subtasks = subtasks.filter(subtask => subtask.taskRef === task.taskRef);
            });
        }*/
        res.status(200).json({
            message: 'tasks fetched successfully',
            data: tasks
        });

    } catch (error) {
        console.error("Error fetching project's tasks:", error);
        res.status(500).json({ 
            error: 'Database error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Obtenir tous les tâches
taskRouter.get('/all-tasks', async (req, res) => {
    try {
        const [tasks] = await db.query(
            "SELECT * FROM task ORDER BY createdAt DESC"
        );

        if (tasks.length === 0) {
            return res.status(200).json({ 
                message: 'No tasks found',
                data: []
            });
        }

        res.status(200).json({
            message: 'tasks fetched successfully',
            data: tasks
        });

    } catch (error) {
        console.error("Error fetching all tasks:", error);
        res.status(500).json({ 
            error: 'Database error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Obtenir un tâche par Ref
taskRouter.get('/:taskRef', async (req, res) => {
    try {
        const taskRef = req.params.taskRef;
        const [tasks] = await db.query(
            "SELECT * FROM task WHERE taskRef = ?", 
            [taskRef]
        );

        if (tasks.length === 0) {
            return res.status(404).json({ 
                error: 'task not found' 
            });
        }

        res.status(200).json({
            message: 'task fetched successfully',
            data: tasks[0]
        });

    } catch (error) {
        console.error('Error getting task:', error);
        res.status(500).json({ 
            error: 'Database error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Mettre à jour un tâche
taskRouter.put('/:taskRef', async (req, res) => {
    try {
        const taskRef = req.params.taskRef;
        const updates = req.body;
        
        // Construction dynamique de la requête UPDATE
        let updateFields = [];
        let values = [];
        
        for (const [key, value] of Object.entries(updates)) {
            // Ne pas mettre à jour certains champs
            if (!['taskRef', 'userRef', 'createdAt'].includes(key)) {
                updateFields.push(`${key} = ?`);
                values.push(value);
            }
        }
        
        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }
        
        values.push(taskRef); // Pour le WHERE
        
        const sql = `
            UPDATE task 
            SET ${updateFields.join(', ')} 
            WHERE taskRef = ?
        `;
        
        const [result] = await db.query(sql, values);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'task not found' });
        }
        
        // Récupérer le tâche mis à jour
        const [updatedtask] = await db.query(
            "SELECT * FROM task WHERE taskRef = ?", 
            [taskRef]
        );
        
        res.status(200).json({
            message: 'task updated successfully',
            data: updatedtask[0]
        });

    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ 
            error: 'Database error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
// Mettre à jour le statut d'une tâche
taskRouter.put('/set-status/:taskRef', async (req, res) => {
    try {
        const taskRef = req.params.taskRef;
        const newStatus = req.body.status;  
        
        const sql = `
            UPDATE task 
            SET status = ? 
            WHERE taskRef = ?
        `;
        
        const [result] = await db.query(sql, [newStatus, taskRef]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'task not found' });
        }
        
        // Récupérer le tâche mis à jour
        const [updatedtask] = await db.query(
            "SELECT * FROM task WHERE taskRef = ?", 
            [taskRef]
        );
        
        res.status(200).json({
            message: 'task updated successfully',
            data: updatedtask[0]
        });

    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ 
            error: 'Database error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Supprimer une tâche
taskRouter.delete('/:taskRef', async (req, res) => {
    try {
        const taskRef = req.params.taskRef;
        
        // D'abord vérifier si le tâche existe
        const [check] = await db.query(
            "SELECT taskRef FROM task WHERE taskRef = ?", 
            [taskRef]
        );
        
        if (check.length === 0) {
            return res.status(404).json({ error: 'task not found' });
        }
        
        // Supprimer la tâche
        const [result] = await db.query(
            "DELETE FROM task WHERE taskRef = ?", 
            [taskRef]
        );
        
        res.status(204).send();

    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ 
            error: 'Database error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

export default taskRouter;