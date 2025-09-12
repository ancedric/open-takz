import supabase from './supabaseConfig';
import moment from 'moment';

const createNotification = async (step, task) => {
  const existingNotification = await supabase
    .from('Notifications')
    .select('*')
    .eq('taskId', task.id)
    .eq('stepId', step.id)
    .eq('userId', task.ownerId)
    .single();

  if (!existingNotification.data) {
    const notification = {
      userId: task.ownerId,
      taskId: task.id,
      stepId: step.id,
      message: `L'étape ${step.title} de la tâche ${task.title} commence aujourd'hui.`,
      read: false,
    };

    const { data, error } = await supabase
      .from('Notifications')
      .insert([notification]);

    if (error) {
      console.log(error);
    }
  }
};


const createUpdateNotification = async (update) => {
  const existingNotification = await supabase
    .from('Notifications')
    .select('*')
    .eq('message', update.title)
    .single();

  if (!existingNotification.data) {
    const notification = {
      userId: null, // Tous les utilisateurs
      message: update.title,
      read: false,
    };

    const { data, error } = await supabase
      .from('Notifications')
      .insert([notification]);

    if (error) {
      console.log(error);
    }
  }
};
  
  const fetchProfile = async (_email) => {
        const { data, error } = await supabase
        .from('Profiles')
        .select('*')
        .eq('email', _email)

        if(error){
          console.log('Error during profile fetching:', error)
        }

        if(data){
          return data[0]
        }
          
      }
      export const checkProfileCompletion = async (userId, userEmail) => {
        const profile = await fetchProfile(userEmail);
      
        if (!profile.firstName || !profile.lastName || !profile.email || !profile.profilePhoto || !profile.country || !profile.city) {
          const existingNotification = await supabase
            .from('Notifications')
            .select('*')
            .eq('userId', userId)
            .eq('message', 'Veuillez compléter vos informations de profil')
            .single();
      
          if (!existingNotification.data) {
            const notification = {
              userId,
              message: 'Veuillez compléter vos informations de profil',
              read: false,
            };
      
            const { data, error } = await supabase
              .from('Notifications')
              .insert([notification]);
      
            if (error) {
              console.log(error);
            }
          }
        }
      };
  const getTaskSteps = async (taskId) => {
    const { data, error } = await supabase 
    .from('TaskSteps')
    .select('*')
    .eq('taskID', taskId)

    if(error){
        console.log(error);
        return []
    }
    if(data){
        return data
    }
  };  

  export const scheduleNotifications = async (profile) => {
    const { data, error } = await supabase
      .from('Tasks')
      .select('*')
      .eq('ownerId', profile.id);

    if (error) {
      console.log(error);
    } 
    if(data) {
      const tasksWithSteps = await Promise.all(data.map(async (task) => {
        const steps = await getTaskSteps(task.id)
        return { ...task, steps }
        }))
        console.log('tasks :', tasksWithSteps)

        tasksWithSteps.map((task) =>{
          task.steps.forEach((step) => {
            const startDate = moment(step.start);
            const now = moment();
    
            if (startDate.isSame(now, 'day')) {
              createNotification(step, task);
            } else {
              const delay = startDate.diff(now);
              setTimeout(() => {
                createNotification(step, task);
              }, delay);
            }
          })
        })    
    }

    // Vérifier les mises à jour
    const { updatesData, updatesError } = await supabase
      .from('Updates')
      .select('*')
      .eq('published', true);

      if (updatesError) {
        console.log(error);
      }
      if(updatesData) {
        updatesData.forEach((update) => {
            createUpdateNotification(update);
        });
      }

};