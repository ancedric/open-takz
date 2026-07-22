import * as payrollHistory from '../models/payrollHistory.model.js';

export const checkExistingPayroll = async (req, res) => {
    const { employee_userref, month } = req.query;

    if (!employee_userref || !month) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        const exists = await payrollHistory.checkExistingPayroll(employee_userref, month);
        res.json({ exists });
    } catch (error) {
        console.error('Error checking payroll history:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};