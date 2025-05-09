import React, { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';

// Types pour le contexte
type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: Error | null;
  signOut: () => Promise<void>;
};

// Valeur par défaut du contexte
const defaultContextValue: AuthContextType = {
  session: null,
  user: null,
  loading: true,
  error: null,
  signOut: async () => {},
};

// Création du contexte
const AuthContext = createContext<AuthContextType>(defaultContextValue);

// Hook personnalisé pour utiliser le contexte
export const useAuth = () => useContext(AuthContext);

// Provider du contexte
type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Fonction pour récupérer la session et l'utilisateur
    const fetchSession = async () => {
      try {
        setLoading(true);
        
        // Récupération de la session actuelle
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        
        if (data.session) {
          const { data: userData } = await supabase.auth.getUser();
          setUser(userData?.user || null);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Erreur lors de la récupération de la session:', err);
        setError(err as Error);
        setUser(null);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    // Exécuter la fonction au chargement
    fetchSession();

    // Abonnement aux changements d'authentification
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        
        if (newSession) {
          const { data } = await supabase.auth.getUser();
          setUser(data?.user || null);
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    // Nettoyage de l'abonnement
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Fonction de déconnexion
  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
    } catch (err) {
      setError(err as Error);
      console.error('Erreur lors de la déconnexion:', err);
    } finally {
      setLoading(false);
    }
  };

  // Valeur du contexte
  const value = {
    session,
    user,
    loading,
    error,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 