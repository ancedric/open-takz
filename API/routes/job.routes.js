import * as job from '../controllers/job.controller.js';

const jobRoutes = (app) => {
  app.post('/', job.createJob);
  app.get('/', job.getAllJobs);
  app.get('/:id', job.getJobById);
  app.put('/:id', job.updateJob);
  app.delete('/:id', job.deleteJob);
  app.get('/get-jobs', job.getJobsWithPagination);
}

export default jobRoutes;