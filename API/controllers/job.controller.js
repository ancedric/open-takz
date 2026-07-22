import * as job from '../models/job.model.js';

// Crée une nouvelle annonce
export const createJob = async (req, res) => {
  try {
    const newJob = await job.create(req.body);
    res.status(201).json(newJob);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupère toutes les annonces
export const getAllJobs = async (req, res) => {
  try {
    const jobs = await job.findAll();
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupère une annonce par son ID
export const getJobById = async (req, res) => {
  try {
    const jobId = req.params.id;
    const jobData = await job.findById(jobId);
    if (!jobData) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.status(200).json(jobData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Met à jour une annonce par son ID
export const updateJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const updatedJob = await job.update(jobId, req.body);
    if (updatedJob.affectedRows === 0) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.status(200).json({ message: 'Job updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Supprime une annonce par son ID
export const deleteJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const deletedJob = await job.deleteJob(jobId);
    if (deletedJob.affectedRows === 0) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.status(200).json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupère les annonces avec pagination
export const getJobsWithPagination = async (req, res) => {
  try {
    const start = parseInt(req.query.start, 10) || 0;
    const end = parseInt(req.query.end, 10) || 10;
    const jobs = await job.findWithPagination(start, end);
    res.status(200).json({ success: true, data: jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};