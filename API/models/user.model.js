import pool from '../services/db.js';

export const findUserByEmail = async (email) => {
  const sql = `
    SELECT u.*, e.* FROM "user" u
    LEFT JOIN employe e ON u.userref = e.userref
    WHERE email = $1
  `
  
  const res = await pool.query(sql, [email]);
  return res.rows[0];
};

export const findUserPhone = async (userref) => {
  const sql = `
    SELECT phone FROM "user"
    WHERE userref = $1
  `
  
  const res = await pool.query(sql, [userref]);
  return res.rows[0];
};

export const findUserByRef = async (userRef) => {
  const res = await pool.query(
    `SELECT userref, firstname, lastname, email, country, city, profilePhotoUrl, privilege, createdAt 
     FROM "user" WHERE userref = $1`, 
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
    privilege
  } = user;

  try {
    const query = `
      INSERT INTO "user" 
        (userref, firstname, lastname, email, password, country, city, profilephotourl, privilege, createdat) 
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *;
    `;

    const values = [userRef, firstname, lastname, email, password, country, city, profilePhotoUrl, privilege];

    const res = await pool.query(query, values);
    return res.rows[0];
  } catch(err){
    console.error("Erreur lors de la création de l'utilisateur:", err)
    throw err;
  }
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
