import pool from "../services/db.js";

export const fetchCompanyPaymentMethod = async (companyref) => {
    const sql = `
        SELECT accaount_identifier FROM company_payment_methods 
        WHERE companyref = $1
        AND is_primary = $2;
    `;
     const res = await pool.query(sql, [companyref, true]);
     return res.rows[0];
}