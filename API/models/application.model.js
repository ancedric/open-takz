import pool from "../services/db.js";

export const create = async (data) => {
  const [result] = await pool.query('INSERT INTO applications SET ?', data);
  return result;
};

export const findAll = async () => {
  const [rows] = await pool.query('SELECT * FROM applications');
  return rows;
};

export const findById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM applications WHERE id = $1', [id]);
  return rows[0];
};

export const findByUserEmail = async (email) => {
  const [rows] = await pool.query('SELECT * FROM applications WHERE user_email = $1', [email]);
  return rows;
};

export const getStatsByUserEmail = async (email) => {
  const [rows] = await pool.query('SELECT COUNT(*) as total, SUM(CASE WHEN status = "active" THEN 1 ELSE 0 END) as active FROM applications WHERE user_email = $1', [email]);
  return rows[0];
};

export const update = async (id, data) => {
  const [result] = await pool.query('UPDATE applications SET ? WHERE id = $1', [data, id]);
  return result;
};

export const deleteApplication = async (id) => {
  const [result] = await pool.query('DELETE FROM applications WHERE id = $1', [id]);
  return result;
};
