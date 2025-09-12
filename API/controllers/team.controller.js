// controllers/team.controller.js
import { createTeam, getTeamByProjectRef, getTeamMembers } from '../models/team.model.js';

export const createTeamForProject = async (req, res) => {
  const projectRef = req.params.projectRef;

  if (!projectRef) {
    return res.status(400).json({ error: 'projectRef requis' });
  }

  try {
    const teamRef = `TEAM_${Math.floor(Math.random() * 1000000)}`;
    const result = await createTeam(teamRef, projectRef);

    res.status(201).json({
      message: 'Équipe créée avec succès',
      teamRef,
      data: result,
    });
  } catch (error) {
    console.error('Erreur création équipe:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getTeamAndMembers = async (req, res) => {
  const projectRef = req.params.projectRef;

  try {
    const team = await getTeamByProjectRef(projectRef);
    if (!team) {
      return res.status(404).json({ message: 'Aucune équipe trouvée pour ce projet' });
    }

    const members = await getTeamMembers(team.teamref);

    res.status(200).json({ team, members });
  } catch (error) {
    console.error('Erreur récupération équipe:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
