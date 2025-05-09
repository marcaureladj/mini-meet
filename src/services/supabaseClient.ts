import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

// Récupération des variables d'environnement Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Vérification que les variables sont définies
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Les variables d\'environnement Supabase ne sont pas définies');
  throw new Error('Les variables d\'environnement VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être définies dans votre fichier .env');
}

// Création du client Supabase
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Types pour les résultats des fonctions
interface AuthResult {
  data?: any;
  user?: User;
  error?: any;
}

interface MeetingResult {
  meeting?: any;
  meetings?: any[];
  error?: any;
}

// Définition d'un type plus précis pour les messages
export interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name?: string; // Sera peuplé par la fonction RPC ou la logique client
}

interface MessageResult {
  message?: Message;
  messages?: Message[];
  error?: any;
}

// Fonctions d'authentification
export const signIn = async (email: string, password: string): Promise<AuthResult> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signUp = async (email: string, password: string, fullName: string): Promise<AuthResult> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: fullName
      }
    }
  });
  return { data, error };
};

export const signOut = async (): Promise<AuthResult> => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async (): Promise<AuthResult> => {
  const { data, error } = await supabase.auth.getUser();
  return { user: data.user || undefined, error };
};

// Fonctions pour les réunions
export const createMeeting = async (roomId: string, userId: string): Promise<MeetingResult> => {
  const { data, error } = await supabase
    .from('meetings')
    .insert([{ room_id: roomId, user_id: userId }])
    .select();
  return { meeting: data?.[0], error };
};

export const getMeetingsByUserId = async (userId: string): Promise<MeetingResult> => {
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { meetings: data || undefined, error };
};

export const getMeetingByRoomId = async (roomId: string): Promise<MeetingResult> => {
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('room_id', roomId)
    .single();
  return { meeting: data, error };
};

// Fonctions pour les messages
export const sendMessage = async (roomId: string, senderId: string, content: string): Promise<MessageResult> => {
  const { data, error } = await supabase
    .from('messages')
    .insert([{ room_id: roomId, sender_id: senderId, content }])
    .select();
  return { message: data?.[0], error };
};

export const getMessagesByRoomId = async (roomId: string): Promise<MessageResult> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*') // Idéalement, on voudrait joindre le nom de l'utilisateur ici
    .eq('room_id', roomId)
    .order('created_at', { ascending: true });
  return { messages: data as Message[] || undefined, error };
};

// Nouvelle fonction pour récupérer les messages avec les noms des expéditeurs via RPC
export const getMessagesByRoomIdWithSenders = async (roomId: string): Promise<MessageResult> => {
  const { data, error } = await supabase.rpc('get_messages_with_sender_names', { p_room_id: roomId });
  // La fonction RPC est supposée retourner des objets conformes à l'interface Message,
  // incluant sender_name
  return { messages: data as Message[] || undefined, error };
};

type MessageCallback = (payload: any) => void;

// Fonction pour souscrire aux messages en temps réel
export const subscribeToMessages = (roomId: string, callback: MessageCallback) => {
  return supabase
    .channel(`messages:room_id=eq.${roomId}`)
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'messages',
      filter: `room_id=eq.${roomId}`
    }, callback)
    .subscribe();
};

/**
 * Vérifie si l'utilisateur est actuellement connecté avec une session valide
 * @returns {Promise<boolean>} - True si l'utilisateur est connecté, false sinon
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      return false;
    }
    return true;
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'authentification:', error);
    return false;
  }
};

/**
 * Récupère les détails d'une réunion par son ID
 * @param {string} roomId - ID de la réunion
 * @returns {Promise<{ meeting: any, error: any }>} - Détails de la réunion
 */
export const getMeetingById = async (roomId: string) => {
  try {
    const { data: meeting, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('room_id', roomId)
      .single();
    
    return { meeting, error };
  } catch (error) {
    console.error('Erreur lors de la récupération de la réunion:', error);
    return { meeting: null, error };
  }
};

// Récupérer tous les utilisateurs dans une réunion
export const getAllUsersInMeeting = async (meetingId: string) => {
  try {
    const { data, error } = await supabase
      .from('meeting_participants')
      .select('*')
      .eq('meeting_id', meetingId);
    
    if (error) {
      throw error;
    }
    
    return { users: data, error: null };
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    return { users: null, error };
  }
};

/**
 * Supprime une réunion et ses données associées
 * @param {string} roomId - ID de la réunion à supprimer
 * @param {string} userId - ID de l'utilisateur qui supprime la réunion (vérification du propriétaire)
 * @returns {Promise<{ success: boolean, error: any }>} - Résultat de l'opération
 */
export const deleteMeeting = async (roomId: string, userId: string) => {
  try {
    // Vérifier que l'utilisateur est bien le propriétaire de la réunion
    const { meeting, error: findError } = await getMeetingById(roomId);
    
    if (findError) {
      throw findError;
    }
    
    if (!meeting) {
      throw new Error('Réunion introuvable');
    }
    
    if (meeting.user_id !== userId) {
      throw new Error('Vous n\'êtes pas autorisé à supprimer cette réunion');
    }
    
    // Supprimer d'abord les messages associés à cette réunion
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('room_id', roomId);
    
    if (messagesError) {
      console.error('Erreur lors de la suppression des messages:', messagesError);
      // On continue même si la suppression des messages échoue
    }
    
    // Supprimer les participants associés à cette réunion
    const { error: participantsError } = await supabase
      .from('meeting_participants')
      .delete()
      .eq('meeting_id', roomId);
    
    if (participantsError) {
      console.error('Erreur lors de la suppression des participants:', participantsError);
      // On continue même si la suppression des participants échoue
    }
    
    // Enfin, supprimer la réunion elle-même
    const { error: deleteError } = await supabase
      .from('meetings')
      .delete()
      .eq('room_id', roomId);
    
    if (deleteError) {
      throw deleteError;
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Erreur lors de la suppression de la réunion:', error);
    return { success: false, error };
  }
};

/**
 * Ajoute un utilisateur comme participant à une réunion
 * @param {string} meetingId - ID de la réunion
 * @param {string} userId - ID de l'utilisateur à ajouter
 * @returns {Promise<{ success: boolean, error: any }>} - Résultat de l'opération
 */
export const joinMeeting = async (meetingId: string, userId: string) => {
  try {
    // Vérifier si l'utilisateur est déjà participant
    const { data: existingParticipant, error: checkError } = await supabase
      .from('meeting_participants')
      .select('*')
      .eq('meeting_id', meetingId)
      .eq('user_id', userId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // Code pour "aucun résultat"
      console.error('Erreur lors de la vérification du participant:', checkError);
      throw checkError;
    }
    
    // Si l'utilisateur n'est pas encore participant, l'ajouter
    if (!existingParticipant) {
      const { error: insertError } = await supabase
        .from('meeting_participants')
        .insert([{
          meeting_id: meetingId,
          user_id: userId,
          joined_at: new Date().toISOString()
        }]);
      
      if (insertError) {
        throw insertError;
      }
    } else {
      // Mettre à jour le timestamp si l'utilisateur rejoint à nouveau
      const { error: updateError } = await supabase
        .from('meeting_participants')
        .update({ joined_at: new Date().toISOString() })
        .eq('meeting_id', meetingId)
        .eq('user_id', userId);
      
      if (updateError) {
        throw updateError;
      }
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Erreur lors de l\'ajout du participant à la réunion:', error);
    return { success: false, error };
  }
}; 