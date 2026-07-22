import * as department from '../models/department.model.js';

// Crée les départements par défaut pour une entreprise
export const createDefaultDepartments = async (req, res) => {
  try {
    const { companyref } = req.body;

    const createdDepartments = await department.createDefaultDepartments(companyref);
    res.status(201).json({success: true, message: "Départements par défaut créés avec succès", data: createdDepartments});
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, message: error });
  }
};

// Récupère les départements d'une entreprise par son companyref
export const getDepartmentsByCompanyRef = async (req, res) => {
  try {
    const { companyref } = req.params;
    const departments = await department.findByCompanyRef(companyref);
    res.status(200).json({success: true, data:departments});
  } catch (error) {
    res.status(500).json({success: false,  message: error.message });
  }
};