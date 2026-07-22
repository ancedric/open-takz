import pool from "../services/db.js";

export const addNewAttendance = async (employeeId, companyref, date, checkIn) => {
    const sql = `
    INSERT INTO attendance (employee_id, companyref, date, check_in, status) 
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const result = await pool.query(sql, [employeeId, companyref, date, checkIn, "PRESENT"]);
  console.log("DEBUG MODEL: Requête réussie: ", result)
  return result.rows[0];
}

export const fetchAttendances = async () => {
    const sql = `
    SELECT * FROM Attendance;
  `;
  const result = await pool.query(sql);
  console.log("DEBUG MODEL: Requête réussie: ", result)
  return result.rows;
}

export const fetchCompanyAttendance = async (companyref) => {
    const sql = `
        SELECT * FROM Attendance WHERE companyref = $1;
    `;
  const result = await pool.query(sql, [companyref]);
  console.log("DEBUG MODEL: Requête réussie: ", result)
  return result.rows;
}

export const fetchTodayAttendance = async (companyref, date) => {
    const sql = `
        SELECT * FROM Attendance WHERE companyref = $1 AND date = $2;
    `;
  const result = await pool.query(sql, [companyref, date]);
  console.log("DEBUG MODEL: Requête réussie: ", result)
  return result.rows;
}

export const fetchUserAttendance = async (userref) => {
    const sql = `
        SELECT * FROM Attendance WHERE userref = $1;
    `;
  const result = await pool.query(sql, [userref]);
  console.log("DEBUG MODEL: Requête réussie: ", result)
  return result.rows;
}

export const userCheckOut = async (id, checkOut) => {
    const sql = `
        UPDATE attendance SET check_out = $1 WHERE id = $2 RETURNING *;
    `;

    const result = await pool.query(sql, [checkOut, id]);
    console.log("DEBUG MODEL: Requête réussie: ", result);
    return result.rows[0];
}