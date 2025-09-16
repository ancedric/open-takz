import {
  createAssignment,
  getAssignmentsByTask,
  deleteAssignment,
  checkAssignmentExists,
  getTasksByCollaborator
} from '../models/assignment.model.js';
import { createNotification } from '../models/notification.model.js';

export const createAssignmentController = async (req, res) => {
  const { taskRef, collabRef, userRef } = req.body;

  console.log("DEBUG: Données reçues: ", taskRef, collabRef, userRef)
  if (!collabRef || !taskRef || !userRef) {
    return res.status(400).json({
      error: 'collabRef, taskRef and userRef are required.'
    });
  }

  try {
    const assRef = `ASSIGN_${Math.floor(Math.random() * 1000000)}`;
    const result = await createAssignment(assRef, collabRef, taskRef, userRef);
    
    //Notification de l'assignation
  
    const notifRef = `NOTIF_${Math.floor(Math.random() * 1000000)}`;
    const title = 'Nouvelle assignation de tâche';
    const content = `Vous avez été assigné à une nouvelle tâche.`;
    const newNotif = await createNotification(notifRef, title, content, userRef);
    console.log('Notification créée:', newNotif);
    
    res.status(201).json({
      message: 'Utilisateur assigné à la tâche avec succès.',
      assignmentRef: assRef,
      data: result
    });

  } catch (error) {
    console.error('Erreur lors de la création de l\'assignation:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getAssignmentsByTaskController = async (req, res) => {
  const { taskRef } = req.params;

  try {
    const results = await getAssignmentsByTask(taskRef);

    if (results.length === 0) {
      return res.status(200).json({
        message: 'Aucune assignation trouvée.',
        data: []
      });
    }

    res.status(200).json({
      message: 'Assignations récupérées avec succès.',
      data: results
    });

  } catch (error) {
    console.error('Erreur récupération des assignations:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ✅ Supprimer une assignation
export const deleteAssignmentController = async (req, res) => {
  const { assRef } = req.params;

  try {
    const result = await deleteAssignment(assRef);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Assignation introuvable' });
    }

    //Notification de la suppression d'assignation
    const notifRef = `NOTIF_${Math.floor(Math.random() * 1000000)}`;
    const title = 'Assignation de tâche supprimée';
    const content = `Votre assignation à une tâche a été supprimée.`;
    const newNotif = await createNotification(notifRef, title, content, result.userRef);
    console.log('Notification créée:', newNotif);
    
    res.status(200).json({ message: 'Assignation supprimée avec succès' });

  } catch (error) {
    console.error('Erreur suppression assignation:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ✅ Vérifier si collaborateur déjà assigné
export const checkAssignmentController = async (req, res) => {
  const { taskRef, collabRef } = req.params;

  try {
    const exists = await checkAssignmentExists(taskRef, collabRef);
    res.status(200).json({
      assigned: exists
    });
  } catch (error) {
    console.error('Erreur vérification assignation:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ✅ Récupérer les tâches d’un collaborateur
export const getTasksByCollaboratorController = async (req, res) => {
  const { collabRef } = req.params;

  try {
    const results = await getTasksByCollaborator(collabRef);
    res.status(200).json({
      message: 'Tâches récupérées avec succès',
      data: results
    });

  } catch (error) {
    console.error('Erreur récupération des tâches assignées:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

