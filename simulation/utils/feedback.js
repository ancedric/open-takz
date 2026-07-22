import { supabase } from './supabase.config.js';

export async function logRobotStep(role, activity, status, details = {}) {
    const { error } = await supabase
        .from('robot_logs')
        .insert([ {
            role: role,
            activity: activity,
            status: status,
            error_details: details.error || null,
            company_name: details.company || null
        }]);

    if (error) console.error('Erreur lors de l’envoi du log à Supabase:', error.message);
}

async function getAvailableCandidateEmail() {
  const { data, error } = await supabase
    .from('robot_logs')
    .select('details')
    .eq('role', 'employe')
    .eq('activity', 'WAITING_FOR_RECRUITMENT')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    console.error("Aucun candidat disponible pour le recrutement.");
    return null;
  }
  return data.details; // C'est l'email que l'employé a loggé
}