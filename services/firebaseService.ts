import { User } from "../types";

// Firebase désactivé - Utilisateur par défaut
const defaultUser: User = {
  id: 'default-user',
  email: 'utilisateur@justicia.fr',
  username: 'Utilisateur Justicia',
  avatar: 'https://via.placeholder.com/40/1DB954/FFFFFF?text=U'
};

// Fonctions simplifiées sans Firebase
export const signUp = async (email: string, _password: string): Promise<User> => {
  // Connexion automatique réussie
  return {
    ...defaultUser,
    email,
    username: email.split('@')[0]
  };
};

export const signIn = async (email: string, _password: string): Promise<User> => {
  // Connexion automatique réussie
  return {
    ...defaultUser,
    email,
    username: email.split('@')[0]
  };
};

export const logOut = async (): Promise<void> => {
  // Déconnexion simulée
  return Promise.resolve();
};

export const onAuthStateChange = (callback: (user: User | null) => void): (() => void) => {
  // Utilisateur toujours connecté
  setTimeout(() => callback(defaultUser), 100);
  return () => {}; // Fonction de nettoyage vide
};

export const getCurrentUser = (): User | null => {
  // Toujours retourner l'utilisateur par défaut
  return defaultUser;
};
