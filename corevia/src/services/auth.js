import User from '../models/User';
import { auth } from '../services/firebaseconfig';

const login = async (email, password) => {
  try {
    const { user } = await auth.signInWithEmailAndPassword(email, password);
    const userData = {
      id: user.uid,
      email: user.email,
    };
    return new User(userData);
  } catch (error) {
    console.error(error);
  }
};

const register = async (email, password, name) => {
  try {
    const { user } = await auth.createUserWithEmailAndPassword(email, password);
    const userData = {
      id: user.uid,
      email: user.email,
      name,
    };
    return new User(userData);
  } catch (error) {
    console.error(error);
  }
};

const logout = async () => {
  try {
    await auth.signOut();
  } catch (error) {
    console.error(error);
  }
};

export { login, register, logout };