import {
  createProject,
  getProjectsByUser,
  getAllProjects,
  getProjectByRef,
  updateProject,
  deleteProject
} from '../models/project.model.js';
import { getUserByRef } from './user.controller.js';
import { createTeam } from '../models/team.model.js';
import { insertCollaborator } from '../models/collaborator.model.js';
import { sendEmail } from '../services/email.service.js';

export const createNewProject = async (req, res) => {
  try {
    const {
      name,
      userRef,
      description = null,
      type = null,
      objectives = null,
      start_date = null
    } = req.body;

    if (!name || !userRef) {
      return res.status(400).json({ error: 'Champs requis manquants' });
    }

    // 1. Création du projet
    const now = new Date().toISOString();
    const projectRef = `PROJ_${Math.floor(Math.random() * 1000000)}`;
    const projectValues = [
      projectRef, name, userRef, description, type,
      objectives, start_date, now
    ];

    const project = await createProject(projectValues);

    // 2. Création de l'équipe associée au projet
    const teamRef = `TEAM_${Math.floor(Math.random() * 1000000)}`;
    await createTeam(teamRef, projectRef);
    

    // 3. Ajout de l'utilisateur qui a créé le projet en tant que collaborateur
    const collabRef = `COLLAB_${Math.floor(Math.random() * 1000000)}`;
    const role = 'project_manager'; // Rôle par défaut
    
    // Assurez-vous que votre fonction insertCollaborator accepte le rôle
    await insertCollaborator(collabRef, userRef, teamRef, role);

    //Envoie de l'email de notification de création du nouveau projet
    //1. Récupérer l'email de l'utilisateur
    const newUser = await getUserByRef(userRef);
    if (!newUser || !newUser.email) {
      return res.status(400).json({ error: 'Utilisateur non trouvé ou email manquant' });
    }

    const to = newUser.email;
    const subject = 'Création d\'un nouveau projet sur OpenTaskz !';
    const htmlContent = `<p>Bonjour ${newUser.firstName},</p><p>Félicitations!Vous venez de créer un nouveau projet sur OpenTaskz</p>
                        <p>Détails du projet:</p>
                        <ul></ul>
                          <li>Nom: ${name}</li>
                          <li>Description: ${description || 'N/A'}</li>
                          <li>Type: ${type || 'N/A'}</li>
                          <li>Objectifs: ${objectives || 'N/A'}</li>
                          <li>Date de début: ${start_date || 'N/A'}</li>
                        </ul>
                        <p>Vous pouvez gérer votre projet en vous connectant à votre compte OpenTaskz.</p>
                        <p>Merci d'utiliser notre plateforme!</p>
                        <p>Cordialement,<br/>L'équipe OpenTaskz</p>`;
    
    await sendEmail(to, subject, htmlContent);

    res.status(201).json({
      message: 'Projet, équipe et collaborateur créés avec succès',
      data: {
        project,
        teamRef,
        collabRef,
      }
    });

  } catch (error) {
    console.error('Erreur lors de la création complète du projet:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};

export const fetchUserProjects = async (req, res) => {
  try {
    const { userRef } = req.params;
    const projects = await getProjectsByUser(userRef);
    res.status(200).json({ message: 'Projects fetched', data: projects });
  } catch (error) {
    res.status(500).json({ error: 'Database error', details: error.message });
  }
};

export const fetchAllProjects = async (_req, res) => {
  try {
    const projects = await getAllProjects();
    res.status(200).json({ message: 'All projects', data: projects });
  } catch (error) {
    res.status(500).json({ error: 'Database error', details: error.message });
  }
};

export const fetchProjectByRef = async (req, res) => {
  try {
    const { projectRef } = req.params;
    const project = await getProjectByRef(projectRef);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.status(200).json({ message: 'Project found', data: project });

  } catch (error) {
    res.status(500).json({ error: 'Database error', details: error.message });
  }
};

export const updateProjectByRef = async (req, res) => {
  try {
    const { projectRef } = req.params;
    const updates = req.body;

    const updated = await updateProject(projectRef, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.status(200).json({ message: 'Project updated', data: updated });

  } catch (error) {
    res.status(500).json({ error: 'Database error', details: error.message });
  }
};

export const deleteProjectByRef = async (req, res) => {
  try {
    const { projectRef } = req.params;
    await deleteProject(projectRef);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Database error', details: error.message });
  }
};
