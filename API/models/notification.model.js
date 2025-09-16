import db from '../services/db.js'; 

export const createNotification = async (notifRef, title, content, userRef) => {
    const sql = `
        INSERT INTO notifications (notifRef, title, content, userRef, createdAt, isRead) 
        VALUES ($1, $2, $3, $4, NOW(), FALSE) RETURNING *;
    `;
    const result = await db.query(sql, [notifRef, title, content, userRef]);
    return result.rows[0];
};

export const getAllNotifications = async () => {
    const sql = `SELECT * FROM notifications ORDER BY createdAt DESC;`;
    const result = await db.query(sql);
    return result.rows;
};

export const getNotificationsByUser = async (userRef) => {
    const sql = `SELECT * FROM notifications WHERE userRef = $1 ORDER BY createdAt DESC;`;
    const result = await db.query(sql, [userRef]);
    return result.rows;
};

export const getNotificationByRef = async (notifRef) => {
    const sql = `SELECT * FROM notifications WHERE notifRef = $1;`;
    const result = await db.query(sql, [notifRef]);
    return result.rows[0];
};

export const updateNotificationStatus = async (notifRef, isRead) => {
    const sql = `UPDATE notifications SET isRead = $1 WHERE notifRef = $2 RETURNING *;`;
    const result = await db.query(sql, [isRead, notifRef]);
    return result.rows[0];
};

export const deleteNotification = async (notifRef) => {
    const sql = `DELETE FROM notifications WHERE notifRef = $1;`;
    const result = await db.query(sql, [notifRef]);
    return result.rowCount;
};