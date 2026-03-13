import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_PROJECT_URL,
  process.env.SUPABASE_API_KEY
);

export async function reportRobotActivity(role, activity, status, error = null) {
  await supabase.from('robot_logs').insert([ {
    role: role,
    activity: activity,
    status: status,
    error_details: error,
    timestamp: new Date()
  }]);
}