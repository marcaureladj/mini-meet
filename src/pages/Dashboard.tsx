import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { getMeetingsByUserId, createMeeting, deleteMeeting } from '../services/supabaseClient';
import Header from '../components/Header';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [meetingToDelete, setMeetingToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Récupération des réunions de l'utilisateur
  const fetchMeetings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { meetings: userMeetings, error } = await getMeetingsByUserId(user.id);
      
      if (error) {
        throw error;
      }
      
      setMeetings(userMeetings || []);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la récupération des réunions');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchMeetings();
  }, [user]);

  // Création d'une nouvelle réunion
  const handleCreateMeeting = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Générer un ID unique pour la réunion
      const roomId = uuidv4();
      
      // Créer la réunion dans la base de données
      const { meeting, error } = await createMeeting(roomId, user.id);
      
      if (error) {
        throw error;
      }
      
      // Rediriger vers la salle de réunion
      navigate(`/room/${roomId}`);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de la réunion');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  // Rejoindre une réunion avec un code
  const handleJoinMeeting = () => {
    if (!joinRoomId) {
      setError('Veuillez entrer un code de réunion');
      return;
    }
    
    navigate(`/room/${joinRoomId}`);
  };

  // Rejoindre une réunion existante
  const joinExistingMeeting = (roomId: string) => {
    navigate(`/room/${roomId}`);
  };
  
  // Confirmer la suppression d'une réunion
  const confirmDeleteMeeting = (roomId: string) => {
    setMeetingToDelete(roomId);
    setShowConfirmModal(true);
  };
  
  // Fermer la modal de confirmation
  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setMeetingToDelete(null);
  };
  
  // Supprimer une réunion
  const handleDeleteMeeting = async () => {
    if (!user || !meetingToDelete) return;
    
    try {
      setIsDeleting(true);
      setError(null);
      
      const { success, error } = await deleteMeeting(meetingToDelete, user.id);
      
      if (error) {
        throw error;
      }
      
      if (success) {
        // Mettre à jour la liste des réunions
        setMeetings(prevMeetings => 
          prevMeetings ? prevMeetings.filter(meeting => meeting.room_id !== meetingToDelete) : []
        );
        setSuccess('La réunion a été supprimée avec succès');
        
        // Fermer la modal
        closeConfirmModal();
        
        // Masquer le message de succès après 3 secondes
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression de la réunion');
      console.error('Erreur:', err);
      // Fermer la modal même en cas d'erreur
      closeConfirmModal();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark">
      <Header />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}
        
        {success && (
          <div className="mb-4 rounded-md bg-green-50 p-4">
            <div className="text-sm text-green-700">{success}</div>
          </div>
        )}
        
        <div className="md:grid md:grid-cols-2 gap-6">
          {/* Création de réunion */}
          <div className="card mb-6 md:mb-0">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Créer une nouvelle réunion
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Lancez une nouvelle réunion instantanément. Un lien sera généré pour inviter des participants.
            </p>
            <button
              onClick={handleCreateMeeting}
              className="btn btn-primary w-full"
            >
              Nouvelle réunion
            </button>
          </div>
          
          {/* Rejoindre une réunion */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Rejoindre une réunion
            </h2>
            <div className="mb-4">
              <input
                type="text"
                className="input mb-2"
                placeholder="Entrez le code de la réunion"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
              />
            </div>
            <button
              onClick={handleJoinMeeting}
              className="btn btn-accent w-full"
            >
              Rejoindre
            </button>
          </div>
        </div>
        
        {/* Liste des réunions */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Vos réunions précédentes
          </h2>
          
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ) : meetings.length > 0 ? (
            <div className="bg-white dark:bg-dark-light shadow overflow-hidden rounded-lg">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {meetings.map((meeting) => (
                  <li key={meeting.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Réunion du {new Date(meeting.created_at).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-300">
                        Code: {meeting.room_id}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => joinExistingMeeting(meeting.room_id)}
                        className="btn btn-primary text-sm"
                      >
                        Rejoindre
                      </button>
                      <button
                        onClick={() => confirmDeleteMeeting(meeting.room_id)}
                        className="btn btn-danger text-sm"
                        title="Supprimer la réunion"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-300">
              Vous n'avez pas encore de réunions. Créez votre première réunion!
            </p>
          )}
        </div>
      </main>
      
      {/* Modal de confirmation de suppression */}
      {showConfirmModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white dark:bg-dark-light rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Confirmer la suppression
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-300 mb-4">
              Êtes-vous sûr de vouloir supprimer cette réunion ? Cette action est irréversible et supprimera également tous les messages et données associés.
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={closeConfirmModal}
                className="btn btn-secondary"
                disabled={isDeleting}
              >
                Annuler
              </button>
              <button 
                onClick={handleDeleteMeeting}
                className="btn btn-danger"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Suppression...
                  </span>
                ) : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 