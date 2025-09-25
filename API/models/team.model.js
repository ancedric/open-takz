import db from '../services/db.js';

export const createTeam = async (teamRef, projectRef) => {
  const result = await db.query(
    'INSERT INTO team (teamref, projectref, createdat) VALUES ($1, $2, NOW()) RETURNING *',
    [teamRef, projectRef]
  );
  return result.rows[0];
};

export const getTeamByCollab = async (teamRef) => {
  const results = await db.query(
    `SELECT t.* FROM team t
     JOIN collaborator c ON t.teamref = c.teamref
     WHERE c.teamref = $1`,
    [teamRef]
  );
  return results.rows[0];
}

export const getTeamByProjectRef = async (projectRef) => {
  const results = await db.query(
    'SELECT * FROM team WHERE projectRef = $1',
    [projectRef]
  );
  if(results.rows.length === 0){
    console.log("DEBUG: Aucune équipe")
  }
  return results.rows[0]; 
};

export const getTeamMembers = async (teamRef) => {
  const members = await db.query(
    'SELECT * FROM collaborator WHERE teamref = $1',
    [teamRef]
  );
  return members.rows;
};