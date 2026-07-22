import pool from '../services/db.js';

export const findEmployeByUserRef = async (userRef) => {
  const res = await pool.query('SELECT * FROM "employe" WHERE userref = $1', [userRef]);
  return res.rows[0];
};

export const findEmployeByRef = async (ref) => {
  const res = await pool.query(
    `SELECT *
     FROM "employe" WHERE userref = $1`, 
    [ref]
  );
  return res.rows[0];
};

export const findEmployeByCompany = async (companyref) => {
  const res = await pool.query(
    `SELECT e.*, u.firstname, u.userref, u.lastname, u.email, u.profilephotourl
     FROM "employe" e
     LEFT JOIN "user" u ON e.userref = u.userref
     WHERE e.companyref = $1
     `, 
    [companyref]
  );
  return res.rows;
};

export const newEmploye = async (employe) => {
  const {
    empref,
    userref,
    position,
    privilege
  } = employe;

  const query = `
    INSERT INTO "employe" 
      (empref, userref, position, privilege, hired_at) 
    VALUES 
      ($1, $2, $3, $4, NOW())
    RETURNING *;
  `;

  const values = [empref, userref, position, privilege];

  const res = await pool.query(query, values);
  return res.rows[0];
};

export const updateUserEmploye = async (userRef, employeData) => {
  const { companyref, position, salary, paymentday, privilege, contrat, hired_at } = employeData;

  try{const res = await pool.query(
      `UPDATE "employe" SET companyref= $1, position= $2, salary= $3, paymentday= $4, privilege= $5, contrat= $6, hired_at= $7 WHERE userref = $8 RETURNING *`,
      [companyref, position, salary, paymentday, privilege, contrat, hired_at, userRef]
    );
    return res.rows[0];
  } catch (err){
    console.error("Erreur du serveur ", err)
  }
};

export const updateEmployePrivilege = async (userRef, companyref, position, privilege) => {

  const res = await pool.query(
    `UPDATE "employe" SET companyref = $1, position = $2, privilege = $3 WHERE userref = $4 RETURNING *`,
    [companyref, position, privilege, userRef]
  );
  
  return res.rows[0];
};

export const updateEmployeDepartment = async (userRef, deptref) => {

  const res = await pool.query(
    `UPDATE "employe" SET deptref = $1 WHERE userref = $2 RETURNING *`,
    [deptref, userRef]
  );
  
  return res.rows[0];
};

export const getAllEmployees = async () => {
  const res = await pool.query(
    `SELECT * FROM "employe"`
  );
  return res.rows;
};

export const deleteEmploye = async (ref) => {
  const res = await pool.query(
    `DELETE * FROM "employe" WHERE userref = $1`, ref
  );
  return res.rows;
};
