import pool from '../services/db.js';

export const findUserByEmail = async (email) => {
  const res = await pool.query('SELECT * FROM "user" WHERE email = $1', [email]);
  return res.rows[0];
};

export const findUserByRef = async (userRef) => {
  const res = await pool.query(
    `SELECT userRef, firstname, lastname, email, country, city, profilePhotoUrl, privilege, createdAt 
     FROM "user" WHERE userRef = $1`, 
    [userRef]
  );
  return res.rows[0];
};

export const createUser = async (user) => {
  const {
    userRef,
    firstname,
    lastname,
    email,
    password,
    country,
    city,
    profilePhotoUrl,
    privilege = 'user'
  } = user;

  const query = `
    INSERT INTO "user" 
      (userRef, firstname, lastname, email, password, country, city, profilePhotoUrl, privilege, createdAt) 
    VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    RETURNING *;
  `;

  const values = [userRef, firstname, lastname, email, password, country, city, profilePhotoUrl, privilege];

  const res = await pool.query(query, values);
  return res.rows[0];
};

export const updateUserPassword = async (email, hashedPassword) => {
  const res = await pool.query(
    'UPDATE "user" SET password = $1 WHERE email = $2 RETURNING *',
    [hashedPassword, email]
  );
  return res.rows[0];
};

export const updateUserProfile = async (userRef, profileData) => {
  const { firstname, lastname, country, city } = profileData;

  const res = await pool.query(
    `UPDATE "user" SET firstname = $1, lastname = $2, country = $3, city = $4 WHERE userRef = $5 RETURNING *`,
    [firstname, lastname, country, city, userRef]
  );

  return res.rows[0];
};

export const getAllUsers = async () => {
  const res = await pool.query(
    `SELECT firstname, lastname, email, country, city, profilePhotoUrl, privilege, createdAt FROM "user"`
  );
  return res.rows;
};
