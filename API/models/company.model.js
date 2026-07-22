import db from '../services/db.js';

export const createCompany = async (values) => {
  const sql = `
    INSERT INTO company 
    (companyref, companyname, logo_url, legal_form, country, email, address, register_number, phone, owner_ref, about, activity, expiry_date) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
  `;
  const result = await db.query(sql, values);
  return result.rows[0];
};

export const getAllCompanies = async () => {
  const sql = `SELECT * FROM company ORDER BY createdAt DESC`;
  const result = await db.query(sql);
  return result.rows;
};

export const getCompanyByRef = async (ref) => {
  const result = await db.query(
    "SELECT * FROM company WHERE companyref = $1",
    [ref]
  );
  return result.rows[0];
};

export const updateCompany = async (projectRef, updates) => {
  const keys = Object.keys(updates);
  const values = Object.values(updates);

  const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
  const sql = `UPDATE company SET ${setClause} WHERE companyref = $${keys.length + 1} RETURNING *`;

  const result = await db.query(sql, [...values, projectRef]);
  return result.rows[0];
};

export const deleteCompany = async (ref) => {
  return db.query("DELETE FROM company WHERE companyref = $1", [ref]);
};
