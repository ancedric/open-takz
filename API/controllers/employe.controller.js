import nodemailer from 'nodemailer';
import {
  findEmployeByUserRef,
  findEmployeByRef,
  findEmployeByCompany,
  newEmploye,
  updateUserEmploye,
  updateEmployePrivilege,
  updateEmployeDepartment,
  getAllEmployees,
  deleteEmploye
} from '../models/employe.model.js';

export const getEmployeByUserRef = async (req, res) => {
  const { userref } = req.params;
  if (!userref) {
    return res.status(400).json({ error: 'Employe introuvable', message: 'Référence de l\'employé requise.' });
  }

  try {
    const employe = await findEmployeByUserRef(userref);

    if (!employe) {
      return res.status(401).json({ error: 'Employé introuvable', message: 'Aucun employé trouvé pour cet utilisateur.' });
    }

    res.json({success: true, message: 'Succès', employe: employe });

  } catch (error) {
    console.error('Erreur de récupération  de l\'employé:', error);
    res.status(500).json({ error: 'Erreur serveur', message: 'Erreur de connexion avec le serveur'});
  }
};

export const getCompanyEmployees = async (req, res) => {
  const { companyref } = req.params;
  if (!companyref) {
    return res.status(400).json({ success: false, error: 'Employes introuvable', message: 'Référence de l\'entreprise requise.' });
  }

  try {
    const employees = await findEmployeByCompany(companyref);

    if (!employees) {
      return res.status(401).json({ success: false, error: 'Employés introuvable', message: 'Aucun employé trouvé pour cette entreprise.' });
    }

    res.json({success: true, message: 'Succès', data: employees });

  } catch (error) {
    console.error('Erreur de récupération  des employés:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur', message: 'Erreur de connexion avec le serveur'});
  }
};

export const createEmploye = async ({ empref, userref, position, privilege }, res) => {
  //const { firstname, lastname, email, password, country, city, privilege } = req.body;
  const now = new Date();

  try {
    const date = new Date();

    const employe = await newEmploye({
        empref,
        userref,
        position,
        privilege
      });

    return{ message: 'Employé ajouté avec succès', data: employe };

  } catch (error) {
    console.error('Erreur création employé:', error);
    return{ error: 'Erreur serveur', message: error.message || 'Erreur serveur' };
  }
};

export const updateEmploye = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Erreur Employé', message: 'Non authentifié' });
  }
  const { 
    userref,
    companyref,
    position,
    salary,
    paymentday,
    privilege,
    contrat,
    hired_at 
  } = req.body;

  try {
    const updatedEmploye = await updateUserEmploye(userref, { companyref, position, salary, paymentday, privilege, contrat, hired_at });

    // On renvoie le nouvel utilisateur (le token actuel reste valide mais les infos ont changé)
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Erreur mise à jour employé:', error);
    res.status(500).json({ success: false, error: 'Erreur mise à jour employé' ,message: 'Erreur serveur' });
  }
};

export const updatePrivilege = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Erreur Employé', message: 'Non authentifié' });
  }
  const { userref, companyref, position, privilege } = req.body;

  try {
    const updatedEmploye = await updateEmployePrivilege(userref, companyref, position, privilege);

    // On renvoie le nouvel utilisateur (le token actuel reste valide mais les infos ont changé)
    res.json({ success: true});
  } catch (error) {
    console.error('Erreur mise à jour employé:', error);
    res.status(500).json({ success: false, error: 'Erreur mise à jour employé' ,message: 'Erreur serveur' });
  }
};

export const updateDepartment = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Erreur Employé', message: 'Non authentifié' });
  }
  const { userref } = req.params;
  const { deptref } = req.body;

  try {
    const updatedEmploye = await updateEmployeDepartment(userref, deptref);

    // On renvoie le nouvel utilisateur (le token actuel reste valide mais les infos ont changé)
    res.json({ success: true});
  } catch (error) {
    console.error('Erreur mise à jour employé:', error);
    res.status(500).json({ success: false, error: 'Erreur mise à jour employé' ,message: 'Erreur serveur' });
  }
};

export const getEmployees = async (req, res) => {
  try {
    const employees = await getAllEmployees();
    res.status(200).json({ message: 'Utilisateurs récupérés avec succès', data: employees });
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({ error: 'Erreur serveur', message: 'Erreur lors de la récupération des employés' });
  }
};

export const getEmployeByRef = async (req, res) => {
  const employeRef = req.params.ref;
  try {
    const employe = await findEmployeByRef(employeRef);
    if (!employe) {
      return res.status(404).json({ error: 'Erreur', message: 'Aucun employé trouvé' });
    }
    res.status(200).json({ message: 'Employés récupéré avec succès', data: employe });
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur', message:'Erreur récupération des employés' });
  }
};

export const suppressEmploye = async (req, res) => {
  const empRef = req.params.ref;
  try {
    const del = await deleteEmploye(empRef);
    if (!del) {
      return res.status(404).json({ message: 'Employé non trouvé' });
    }
    res.status(200).json({ message: 'Employé supprimé avec succès'});
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'employé:', error);
    res.status(500).json({ error: 'Erreur serveur', message: 'Erreur lors de la suppression de l\'employé' });
  }
};
