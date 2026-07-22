import pool from '../services/db.js';

export const createDefaultDepartments = async (companyref) => {
    const defaultDepartments = [
        { name: 'Human Resources'},
        { name: 'accounting' },
        { name: 'Sales'}
    ];

    const query = `
        INSERT INTO department ( deptref, deptname, companyref)
        VALUES ($1, $2, $3)
        RETURNING *;
    `;

    const createdDepartments = [];

    for (const department of defaultDepartments) {
        const deptRef = `DPT-${companyref}${Math.random().toString(36).substr(2, 9).toUpperCase()}`
        const values = [deptRef, department.name, companyref];
        const res = await pool.query(query, values);
        createdDepartments.push(res.rows[0]);
    }

    return createdDepartments;
}

export const findByCompanyRef = async (companyref) => {
    const res = await pool.query('SELECT * FROM department WHERE companyref = $1', [companyref]);
    return res.rows;
}