import supabase from '../services/supabaseConfig.js';

const getSavedTasks = async () => {
    /*try {
      const tasks = await getTasks();
      colsole.log("tasks data:", tasks)  ;
        return tasks;
    } catch (error) {
      console.error(error);
      return []; // Renvoie un tableau vide en cas d'erreur
    }*/

    const { data, error } = await supabase 
      .from('Tasks')
      .select()

      if(error){
        console.log(error);
        return []
      }
      if(data){
        console.log(data)
        return data
      }
  };

export default getSavedTasks;