import pool from '../services/db.js';

export const checkExistingPayroll = async (employee_userref, month) => {
    try {
        const query = `
            SELECT COUNT(*) AS count
            FROM payroll_history
            WHERE employee_userref = $1 AND month = $2
        `;
        const values = [employee_userref, month];
        const result = await pool.query(query, values);
        return result.rows[0].count > 0;
    } catch (error) {
        console.error('Error checking payroll history:', error);
        throw error;
    }
};