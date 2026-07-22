import dotenv from 'dotenv'
dotenv.config()
import express from "express";
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import path, { dirname } from 'path';
import multer from 'multer';
import { fileURLToPath } from "url";

// Importez vos routes
import assignmentRouter from './routes/assignment.routes.js';
import userRouter from './routes/user.routes.js';
import empRouter from './routes/employe.routes.js';
import companyRouter from './routes/company.routes.js';
import deptRouter from './routes/department.routes.js';
import applicationRouter from './routes/application.routes.js';
import projectRouter from './routes/project.routes.js';
import taskRouter from './routes/task.routes.js';
import emailRouter from './routes/email.routes.js';
import collabRouter from './routes/collaborator.routes.js';
import teamRouter from './routes/team.routes.js';
import notificationsRouter from './routes/notification.routes.js';
import attendanceRouter from './routes/attendance.routes.js';
import leaveRouter from './routes/leaveRequest.routes.js';
import paymentMethodRouter from './routes/paymentMethod.routes.js';
import payrollHistoryRouter from './routes/payrollHistory.routes.js';

// --- Configuration ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// --- Middlewares de base (À mettre au tout début) ---
app.use(express.json()); // Pour parser application/json
app.use(express.urlencoded({ extended: true })); // Pour parser application/x-www-form-urlencoded
app.use(cors({
    origin: ['https://getcorevia.net', 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// --- Utilisation des routes API et des fichiers statiques du backend ---
app.use('/user', userRouter);
app.use('/employe', empRouter);
app.use('/company', companyRouter);
app.use('/department', deptRouter);
app.use('/application', applicationRouter);
app.use('/project', projectRouter);
app.use('/task', taskRouter);
app.use('/assignment', assignmentRouter);
app.use('/attendance', attendanceRouter);
app.use('/email', emailRouter);
app.use('/leave', leaveRouter);
app.use('/collaborator', collabRouter);
app.use('/team', teamRouter);
app.use('/notification', notificationsRouter);
app.use('/payment-method', paymentMethodRouter);
app.use('/payroll-history', payrollHistoryRouter);
// Le middleware pour servir les images du backend doit être placé ici
app.use('/images', express.static(path.join(__dirname, 'images')));

// --- Middlewares pour le front-end (Doivent être à la toute fin) ---
// Express doit d'abord vérifier toutes les routes API avant de renvoyer le front-end.
/*app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));

// L'expression régulière (wildcard) gère toutes les autres requêtes non reconnues par les routes API.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
});*/

// --- Lancement du serveur ---
app.listen(process.env.PORT, ()=>{
    console.log(`Connected to the server on localhost:${process.env.PORT}`);
})

export default app;