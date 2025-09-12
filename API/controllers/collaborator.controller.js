import {
  findUserById,
  findTeamById,
  insertCollaborator,
  getCollaboratorsByTeamRef,
  getCollaboratorByRef,
  updateCollaboratorRole,
  deleteCollaboratorByRef,
} from '../models/collaborator.model.js';

export const addCollaborator = async (req, res) => {
  const { userRef, teamRef } = req.body;
  if (!userRef || !teamRef) {
    return res.status(400).json({ error: 'userRef and teamRef are required' });
  }

  try {
    const userResult = await findUserById(userRef);
    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const teamResult = await findTeamById(teamRef);
    if (teamResult.rowCount === 0) {
      return res.status(404).json({ error: 'Équipe non trouvée' });
    }

    const collabRef = `COLLAB_${Math.floor(Math.random() * 1000000)}`;
    await insertCollaborator(collabRef, userRef, teamRef);

    return res.status(201).json({ message: 'Collaborateur ajouté avec succès' });
  } catch (error) {
    if (error.code === '23505') { // PostgreSQL duplicate key violation
      return res.status(400).json({ error: 'Cet utilisateur est déjà membre de l\'équipe' });
    }
    console.error('Erreur ajout collaborateur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getTeamMembers = async (req, res) => {
  const { teamRef } = req.params;
  try {
    const result = await getCollaboratorsByTeamRef(teamRef);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'No collaborator found in this team.' });
    }
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erreur récupération collaborateurs:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getCollaborator = async (req, res) => {
  const { collabRef } = req.params;
  try {
    const result = await getCollaboratorByRef(collabRef);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'No collaborator found.' });
    }
    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur récupération collaborateur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updateRole = async (req, res) => {
  const { collabRef } = req.params;
  const { role } = req.body;

  if (!role) {
    return res.status(400).json({ error: 'Le nouveau rôle est requis' });
  }

  try {
    const result = await updateCollaboratorRole(collabRef, role);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Collaborateur non trouvé' });
    }
    return res.status(200).json({ message: 'Rôle mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur mise à jour rôle:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const deleteCollaborator = async (req, res) => {
  const { collabRef } = req.params;

  try {
    const result = await deleteCollaboratorByRef(collabRef);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Collaborateur non trouvé' });
    }
    return res.status(200).json({ message: 'Collaborateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression collaborateur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
