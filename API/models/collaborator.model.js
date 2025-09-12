import db from '../services/db.js';

export const findUserById = async (userRef) => {
  const query = 'SELECT userRef FROM users WHERE id = $1';
  return db.query(query, [userRef]);
};

export const findTeamById = async (teamRef) => {
  const query = 'SELECT teamRef FROM teams WHERE id = $1';
  return db.query(query, [teamRef]);
};

export const insertCollaborator = async (collabRef, userRef, teamRef, role) => {
  const query = `
    INSERT INTO collaborator (collabRef, userRef, teamRef, role)
    VALUES ($1, $2, $3, $4) RETURNING *
  `;
  const result = await db.query(query, [collabRef, userRef, teamRef, role]);
  return result.rows[0];
};

export const getCollaboratorsByTeamRef = async (teamRef) => {
  const query = 'SELECT * FROM collaborator WHERE teamRef = $1';
  const [result] = await db.query(query, [teamRef]);
  return result.rows;
};

export const getCollaboratorByRef = async (collabRef) => {
  const query = 'SELECT * FROM collaborator WHERE collabRef = $1';
  return db.query(query, [collabRef]);
};

export const getUserCollaborator = async (userRef) => {
  const query = 'SELECT * FROM user WHERE userRef = $1';
  return db.query(query, [userRef]);
};

export const updateCollaboratorRole = async (collabRef, role) => {
  const query = 'UPDATE collaborator SET role = $1 WHERE collabRef = $2';
  return db.query(query, [role, collabRef]);
};

export const deleteCollaboratorByRef = async (collabRef) => {
  const query = 'DELETE FROM collaborator WHERE collabRef = $1';
  return db.query(query, [collabRef]);
};
