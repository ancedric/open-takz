// controllers/task.controller.js
import {
  createTask,
  getTasksByProject,
  getAllTasks,
  getTaskByRef,
  updateTask,
  updateTaskStatus,
  deleteTask,
  taskExists
} from '../models/task.model.js';

export const createTaskController = async (req, res) => {
  try {
    const { taskName, projectRef, taskStart, taskEnd, status } = req.body;

    if (!taskName || !projectRef) {
      return res.status(400).json({ error: 'taskName et projectRef sont requis' });
    }

    const taskRef = `TASK_${Math.floor(Math.random() * 1000000)}`;
    const result = await createTask({
      taskRef,
      taskName,
      startDate: taskStart,
      endDate: taskEnd,
      status,
      projectRef
    });

    if (result.affectedRows === 0) {
      return res.status(500).json({ error: 'Échec de la création de la tâche' });
    }

    res.status(201).json({
      message: 'Tâche créée avec succès',
      taskRef,
      taskId: result.insertId,
      projectRef
    });

  } catch (error) {
    console.error('Erreur lors de la création de tâche:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getTasksByProjectController = async (req, res) => {
  try {
    const projectRef = req.params.projectRef;
    const tasks = await getTasksByProject(projectRef);
    res.status(200).json({ message: 'Tâches récupérées avec succès', data: tasks });
  } catch (error) {
    console.error('Erreur récupération tâches projet:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getAllTasksController = async (req, res) => {
  try {
    const tasks = await getAllTasks();
    res.status(200).json({ message: 'Tâches récupérées avec succès', data: tasks });
  } catch (error) {
    console.error('Erreur récupération toutes les tâches:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getTaskByRefController = async (req, res) => {
  try {
    const task = await getTaskByRef(req.params.taskRef);
    if (!task) return res.status(404).json({ error: 'Tâche non trouvée' });
    res.status(200).json({ message: 'Tâche récupérée avec succès', data: task });
  } catch (error) {
    console.error('Erreur récupération tâche:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updateTaskController = async (req, res) => {
  try {
    const taskRef = req.params.taskRef;
    const result = await updateTask(taskRef, req.body);
    if (!result || result.affectedRows === 0) {
      return res.status(404).json({ error: 'Tâche non trouvée ou rien à mettre à jour' });
    }

    const updatedTask = await getTaskByRef(taskRef);
    res.status(200).json({ message: 'Tâche mise à jour', data: updatedTask });
  } catch (error) {
    console.error('Erreur mise à jour tâche:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updateTaskStatusController = async (req, res) => {
  try {
    const taskRef = req.params.taskRef;
    const { status } = req.body;
    const result = await updateTaskStatus(taskRef, status);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Tâche non trouvée' });
    }

    const updatedTask = await getTaskByRef(taskRef);
    res.status(200).json({ message: 'Statut mis à jour', data: updatedTask });
  } catch (error) {
    console.error('Erreur mise à jour statut:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const deleteTaskController = async (req, res) => {
  try {
    const taskRef = req.params.taskRef;
    const exists = await taskExists(taskRef);
    if (!exists) return res.status(404).json({ error: 'Tâche non trouvée' });

    await deleteTask(taskRef);
    res.status(204).send();
  } catch (error) {
    console.error('Erreur suppression tâche:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
