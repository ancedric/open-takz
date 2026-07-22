import pool from "../services/db.js";

export const create = async (data) => {
  const [result] = await pool.query('INSERT INTO jobs SET ?', data);
  return result;
};

export const findAll = async () => {
  const [rows] = await pool.query('SELECT * FROM jobs');
  return rows;
};

export const findById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM jobs WHERE id = $1', [id]);
  return rows[0];
};

export const update = async (id, data) => {
  const [result] = await pool.query('UPDATE jobs SET ? WHERE id = $1', [data, id]);
  return result;
};

export const deleteJob = async (id) => {
  const [result] = await pool.query('DELETE FROM jobs WHERE id = $1', [id]);
  return result;
};

export const findWithPagination = async (start, end) => {
  const [rows] = await pool.query('SELECT * FROM jobs ORDER BY created_at DESC LIMIT $1 OFFSET $2', [end - start + 1, start]);
  return rows;
}