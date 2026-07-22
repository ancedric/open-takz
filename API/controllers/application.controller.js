import * as application from '../models/application.model.js';

// Crée une nouvelle application
export const createApplication = async (req, res) => {
  try {
    const newApplication = await application.create(req.body);
    res.status(201).json(newApplication);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupère toutes les applications
export const getAllApplications = async (req, res) => {
  try {
    const applications = await application.findAll();
    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupère une application par son ID
export const getApplicationById = async (req, res) => {
  try {
    const appId = req.params.id;
    const app = await application.findById(appId);
    if (!app) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.status(200).json(app);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupère toutes les applications d'un utilisateur par son email
export const getApplicationsByUserEmail = async (req, res) => {
  try {
    const userEmail = req.params.email;
    const apps = await application.findByUserEmail(userEmail);
    res.status(200).json(apps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupère les statistiques des applications d'un utilisateur par son email
export const getApplicationStatsByUserEmail = async (req, res) => {
  try {
    const userEmail = req.params.email;
    const stats = await application.getStatsByUserEmail(userEmail);
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Met à jour une application par son ID
export const updateApplication = async (req, res) => {
  try {
    const appId = req.params.id;
    const updatedApp = await application.update(appId, req.body);
    if (!updatedApp) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.status(200).json(updatedApp);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Supprime une application par son ID
export const deleteApplication = async (req, res) => {
  try {
    const appId = req.params.id;
    const deletedApp = await application.delete(appId);
    if (!deletedApp) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.status(200).json({ message: 'Application deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Soumet une application
export const submitApplication = async (req, res) => {
  try {
    const { userRef, jobRef, formData, file } = req.body;
    const newApplication = await application.create({
      user_ref: userRef,
      job_ref: jobRef,
      form_data: formData,
      file_url: file || null
    });
    res.status(201).json({ success: true, application: newApplication });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Enregistre un emploi pour un utilisateur
export const saveJob = async (req, res) => {
  try {
    const { userRef, jobRef } = req.body;
    const savedJob = await application.createSavedJob({ 
        user_ref: userRef,
        job_ref: jobRef
    });
    res.status(201).json({ success: true, savedJob });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Supprime un emploi enregistré pour un utilisateur
export const removeSavedJob = async (req, res) => {
  try {
    const { userRef, jobRef } = req.params;
    const removedJob = await application.deleteSavedJob(userRef, jobRef);
    res.status(200).json({ success: true, removedJob });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};