import dotenv from 'dotenv'
dotenv.config()
import express from "express";
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import path, { dirname } from 'path';
import multer from 'multer';
import { fileURLToPath } from "url";
import assignmentRouter from './routes/assignment.routes.js';
import userRouter from './routes/user.routes.js';
import projectRouter from './routes/project.routes.js';
import taskRouter from './routes/task.routes.js';
//import emailRouter from './routes/email.routes.js';
import collabRouter from './routes/collaborator.routes.js';
import teamRouter from './routes/team.routes.js';
//import notificationsRouter from './routes/notifications.routes.js';

//options de stockage pour multer
const storage = multer.diskStorage({
    destination: process.env.MULTER_PATH,
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    },
})

// Middleware de téléchargement avec Multer
const upload = multer({ storage : storage });

// Chemin du module actuel
const __filename = fileURLToPath(import.meta.url);
// Répertoire parent en utilisant path et __filename
const __dirname = dirname(__filename);

//const server = http.createServer(app);
const app = express();
// Middleware essentiels (à mettre au tout début)
app.use(express.json()); // Pour parser application/json
app.use(express.urlencoded({ extended: true })); // Pour parser application/x-www-form-urlencoded

// Configurez CORS  :
app.use(cors({
    origin: ['https://open-tasks.onrender.com','http://localhost:5173', 'http://localhost:5174'],
    credentials: true, // Autorise les cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }));
  
//Utilisation des routes
app.use('/user', userRouter);
app.use('/project', projectRouter);
app.use('/task', taskRouter);
app.use('/assignment', assignmentRouter);
app.use('/email', emailRouter);
app.use('/collab', collabRouter);
app.use('/team', teamRouter);
//app.use('/notification', notificationsRouter);


app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});
// Middleware pour servir les fichiers statiques
app.use('/images', express.static(path.join(__dirname, 'images')));

app.listen(process.env.PORT, ()=>{
    console.log(`Connected to the server on localhost:${process.env.PORT}`);
})

export default app;
