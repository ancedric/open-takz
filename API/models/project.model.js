import db from '../services/db.js';

export const createProject = async (values) => {
  const sql = `
    INSERT INTO project 
    (projectRef, projectName, userRef, projectDesc, projectType, projectCible, projectStart, createdAt) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  const result = await db.query(sql, values);
  return result.rows[0];
};

export const getProjectsByUser = async (userRef) => {
  const sql = `
    SELECT * FROM project WHERE userRef = $1 ORDER BY createdAt DESC
  `;
  const result = await db.query(sql, [userRef]);
  return result.rows;
};

export const getAllProjects = async () => {
  const sql = `SELECT * FROM project ORDER BY createdAt DESC`;
  const result = await db.query(sql);
  return result.rows;
};

export const getProjectByRef = async (ref) => {
  const result = await db.query(
    "SELECT * FROM project WHERE projectRef = $1",
    [ref]
  );
  return result.rows[0];
};

export const updateProject = async (projectRef, updates) => {
  const keys = Object.keys(updates);
  const values = Object.values(updates);

  const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
  const sql = `UPDATE project SET ${setClause} WHERE projectRef = $${keys.length + 1} RETURNING *`;

  const result = await db.query(sql, [...values, projectRef]);
  return result.rows[0];
};

export const deleteProject = async (ref) => {
  return db.query("DELETE FROM project WHERE projectRef = $1", [ref]);
};
