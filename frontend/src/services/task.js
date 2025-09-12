import { db } from './firebaseconfig';
import { doc, getDoc } from "firebase/firestore";

const addTask = async (task) => {
  try {
    await db.collection('Tasks').add(task);
  } catch (error) {
    console.error(error);
  }
};

const getTasks = async () => {
  /*try {
    const tasks = await db.collection('Tasks').get();
    return tasks.docs.map((doc) => doc.data());
  } catch (error) {
    console.error(error);
  }*/
    const tasks = doc(db, 'Tasks')
    const docSnap = await getDoc(tasks);

    if(docSnap.exists()){
      console.log("tasks data:", docSnap.data());
    } else {
      console.log("No such document!");
    }
};

const deleteTask = async (id) => {
  try {
    await db.collection('Tasks').doc(id).delete();
  } catch (error) {
    console.error(error);
  }
};

const updateTask = async (id, task) => {
  try {
    await db.collection('Tasks').doc(id).update(task);
  } catch (error) {
    console.error(error);
  }
};

export { addTask, getTasks, deleteTask, updateTask };