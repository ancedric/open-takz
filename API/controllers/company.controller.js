import * as company from '../models/company.model.js';;
import { findUserByRef } from '../models/user.model.js';


export const createNewCompany = async (req, res) => {

  const companyRef = 'COMP-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  //On ajoute 1 mois d'essaie gratuit
    const today = new Date();
    const expiry_date = new Date(today.setMonth(today.getMonth() + 1)).toISOString();
  const {
      companyname, 
      logo_url, 
      legal_form, 
      country, 
      email, 
      address, 
      register_number, 
      phone, 
      owner_ref, 
      about, 
      activity
    } = req.body;

    if (!companyname) {
      return res.status(400).json({ error: 'Erreur', message:'Champs requis manquants' });
    }

  try {
    const values = [
        companyRef,
        companyname, 
        logo_url, 
        legal_form, 
        country, 
        email, 
        address, 
        register_number, 
        phone, 
        owner_ref, 
        about, 
        activity,
        expiry_date
    ];

    const comp = await company.createCompany(values);
    if(comp){
        res.status(201).json({
            success: true,
            message: 'Entreprise créée avec succès',
            company: comp
        });
    }

  } catch (error) {
    console.error('Erreur lors de la création de l\'entreprise:', error);
    res.status(500).json({ succes: false, error: 'Erreur serveur', message: error.message });
  }
};

export const fetchAllCompanies = async (_req, res) => {
  try {
    const companies = await company.getAllCompanies();
    res.status(200).json({ success: true, message: 'All companies', data: companies });
  } catch (error) {
    res.status(500).json({ error: 'Database error', details: error.message });
  }
};

export const fetchCompanyByRef = async (req, res) => {
  try {
    const { companyRef } = req.params;
    const comp = await company.getCompanyByRef(companyRef);

    if (!comp) {
      return res.status(404).json({ success: false, error: 'company not found', message: 'Aucune entreprise trouvée' });
    }

    res.status(200).json({ success: true, message: 'Company found', company: comp });

  } catch (error) {
    res.status(500).json({ error: 'Database error', message: error.message });
  }
};

export const updateCompanyByRef = async (req, res) => {
  try {
    const { companyRef } = req.params;
    const updates = req.body;

    const updated = await company.updateCompany(companyRef, updates);
    if (!updated) {
      return res.status(404).json({ error:'Co:pany not found', message:'Sorry! We cannot found this company.' });
    }
    res.status(200).json({ success: true, message: 'Company updated', data: updated });

  } catch (error) {
    res.status(500).json({ error: 'Database error', message: error.message });
  }
};

export const deleteCompanyByRef = async (req, res) => {
  try {
    const { projectRef } = req.params;
    await company.deleteCompany(companyRef);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Database error', details: error.message });
  }
};
