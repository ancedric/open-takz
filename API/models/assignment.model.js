import db from '../services/db.js';

export const createAssignment = async (assRef, collabRef, taskRef, userRef) => {
  console.log("DEBUG MODEL: Données reçues: ", assRef, collabRef, taskRef, userRef)
  const sql = `
    INSERT INTO assignments (assRef, collabRef, taskRef, userref, dateAssigned) 
    VALUES ($1, $2, $3, $4, NOW())
    RETURNING *;
  `;
  const result = await db.query(sql, [assRef, collabRef, taskRef, userRef]);
  console.log("DEBUG MODEL: Requête réussie: ", result)
  return result.rows[0];
};

export const getAssignmentsByTask = async (taskRef) => {
  const sql = `SELECT * FROM assignments WHERE taskRef = $1`;
  const result = await db.query(sql, [taskRef]);
  return result.rows;
};

// Supprimer une assignation
export const deleteAssignment = async (assRef) => {
  const sql = `DELETE FROM assignments WHERE assRef = $1`;
  const result = await db.query(sql, [assRef]);
  // Retourne le nombre de lignes supprimées
  return result.rowCount;
};

// Vérifier une assignation existante
export const checkAssignmentExists = async (taskRef, collabRef) => {
  const sql = `SELECT 1 FROM assignments WHERE taskRef = $1 AND collabRef = $2`;
  const result = await db.query(sql, [taskRef, collabRef]);
  // Retourne true si au moins une ligne a été trouvée
  return result.rowCount > 0;
};

// Obtenir toutes les tâches assignées à un collaborateur
export const getTasksByCollaborator = async (collabRef) => {
  const sql = `
    SELECT a.*, t.taskName, t.status, t.projectRef 
    FROM assignments a 
    JOIN task t ON t.taskRef = a.taskRef
    WHERE a.collabRef = $1
  `;
  const result = await db.query(sql, [collabRef]);
  return result.rows;
};