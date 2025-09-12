import db from '../services/db.js';

export const createTask = async (task) => {
  const sql = `
    INSERT INTO task (taskRef, taskName, startDate, endDate, status, projectRef) 
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  const values = [
    task.taskRef,
    task.taskName,
    task.startDate || null,
    task.endDate || null,
    task.status || 'ongoing',
    task.projectRef
  ];
  // The result object has a 'rows' property containing the results.
  const result = await db.query(sql, values);
  return result.rows[0];
};

export const getTasksByProject = async (projectRef) => {
  const sql = "SELECT * FROM task WHERE projectRef = $1";
  const result = await db.query(sql, [projectRef]);
  return result.rows;
};

export const getAllTasks = async () => {
  const sql = "SELECT * FROM task ORDER BY createdAt DESC";
  const result = await db.query(sql);
  return result.rows;
};

export const getTaskByRef = async (taskRef) => {
  const sql = "SELECT * FROM task WHERE taskRef = $1";
  const result = await db.query(sql, [taskRef]);
  return result.rows[0];
};

export const updateTask = async (taskRef, updates) => {
  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    if (!['taskRef', 'createdAt'].includes(key)) {
      // Use positional placeholders: $1, $2, etc.
      values.push(value);
      fields.push(`${key} = $${values.length}`);
    }
  }

  if (fields.length === 0) return null;

  // The last placeholder will be for the taskRef in the WHERE clause.
  values.push(taskRef);

  const sql = `UPDATE task SET ${fields.join(', ')} WHERE taskRef = $${values.length} RETURNING *`;
  const result = await db.query(sql, values);
  return result.rows[0];
};

export const updateTaskStatus = async (taskRef, status) => {
  const sql = "UPDATE task SET status = $1 WHERE taskRef = $2 RETURNING *";
  const result = await db.query(sql, [status, taskRef]);
  return result.rows[0];
};

export const deleteTask = async (taskRef) => {
  const sql = "DELETE FROM task WHERE taskRef = $1";
  const result = await db.query(sql, [taskRef]);
  return result.rowCount; // Returns the number of deleted rows.
};

export const taskExists = async (taskRef) => {
  const sql = "SELECT 1 FROM task WHERE taskRef = $1";
  const result = await db.query(sql, [taskRef]);
  return result.rowCount > 0;
};