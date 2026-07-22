import pool from "../services/db.js";

export const newRequest = async (reqRef, employee_id, employee_name, companyref, type, start_date, end_date, duration_days,  reason, status) => {
    const sql = `
    INSERT INTO leave_request (employee_id, employee_name, companyref, type, start_date, end_date, duration_days,  reason, status, request_ref) 
    VALUES ($1, $2, $3, $4, $5,$6, $7, $8, $9, $10)
    RETURNING *;
  `;
  const result = await pool.query(sql, [employee_id, employee_name, companyref, type, start_date, end_date, duration_days,  reason, status, reqRef]);
  console.log("DEBUG MODEL: Requête réussie: ", result)
  return result.rows[0];
}

export const fetchAllRequests = async () => {
    const sql = `
    SELECT * FROM leave_request;
  `;
  const result = await pool.query(sql);
  console.log("DEBUG MODEL: Requête réussie: ", result)
  return result.rows;
}

export const fetchCompanyLeaveRequests = async (companyref) => {
    const sql = `
        SELECT * FROM leave_request WHERE companyref = $1;
    `;
  const result = await pool.query(sql, [companyref]);
  console.log("DEBUG MODEL: Requête réussie: ", result)
  return result.rows;
}

export const deleteLeaveRequest = async (ref) => {
    const sql = `
        DELETE FROM leave_request WHERE request_ref = $1;
    `;
  const result = await pool.query(sql, [ref]);
  console.log("DEBUG MODEL: Requête réussie: ", result)
  return result.rows;
}

export const fetchUserLeaveRequests = async (employeeId) => {
    const sql = `
        SELECT * FROM leave_request WHERE employee_id = $1;
    `;
  const result = await pool.query(sql, [employeeId]);
  console.log("DEBUG MODEL: Requête réussie: ", result)
  return result.rows;
}