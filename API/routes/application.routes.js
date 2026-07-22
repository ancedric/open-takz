import * as application from '../controllers/application.controller.js';

const applicationRoutes = (app) => {
    app.post('/', application.createApplication);
    app.post('/submit-application', application.submitApplication);
    app.post('/save-job', application.saveJob);
    app.delete('/remove-saved-job/:userRef/:jobRef', application.removeSavedJob);
    app.get('/', application.getAllApplications);
    app.get('/:id', application.getApplicationById);
    app.get('/user/:email', application.getApplicationsByUserEmail);
    app.get('/get-stats/:email', application.getApplicationStatsByUserEmail);
    app.put('/:id', application.updateApplication);
    app.delete('/:id', application.deleteApplication);
}

export default applicationRoutes;