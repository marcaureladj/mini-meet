import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import VideoPlayer from '../components/VideoPlayer';
import ChatBox from '../components/ChatBox';
import ControlBar from '../components/ControlBar';
import { 
  disconnectFromPeer, 
  initializePeer, 
  listenToConnections,
  callPeer
} from '../services/peerClient';
import { 
  getMeetingById, 
  getAllUsersInMeeting, 
  joinMeeting 
} from '../services/supabaseClient';

interface Participant {
  id: string;
  stream: MediaStream | null;
  name: string;
}

const MeetRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<{ id: string; stream: MediaStream }[]>([]);
  const [peer, setPeer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meetingDetails, setMeetingDetails] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [otherUsers, setOtherUsers] = useState<string[]>([]);
  
  // États pour l'interface
  const [activeParticipant, setActiveParticipant] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [meetingTime, setMeetingTime] = useState<string>('00:00:00');
  const [incomingMessage, setIncomingMessage] = useState<{from: string, text: string} | null>(null);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // Surveiller le redimensionnement de la fenêtre
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Compteur de temps pour la réunion
  useEffect(() => {
    let startTime = Date.now();
    let timer: NodeJS.Timeout;
    
    const updateTimer = () => {
      const elapsedTime = Date.now() - startTime;
      const hours = Math.floor(elapsedTime / 3600000).toString().padStart(2, '0');
      const minutes = Math.floor((elapsedTime % 3600000) / 60000).toString().padStart(2, '0');
      const seconds = Math.floor((elapsedTime % 60000) / 1000).toString().padStart(2, '0');
      setMeetingTime(`${hours}:${minutes}:${seconds}`);
      
      timer = setTimeout(updateTimer, 1000);
    };
    
    updateTimer();
    
    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Vérification de l'existence de la réunion et récupération des utilisateurs
  useEffect(() => {
    if (!roomId || !user) return;

    const fetchMeetingAndUsers = async () => {
      try {
        // Récupérer les détails de la réunion
        const { meeting, error } = await getMeetingById(roomId);
        
        if (error) {
          throw new Error('Impossible de charger les détails de la réunion');
        }
        
        if (!meeting) {
          throw new Error('Cette réunion n\'existe pas');
        }
        
        setMeetingDetails(meeting);

        // Enregistrer l'utilisateur actuel comme participant
        console.log('Enregistrement de l\'utilisateur comme participant:', user.id);
        const { success, error: joinError } = await joinMeeting(roomId, user.id);
        
        if (!success) {
          console.error('Erreur lors de l\'enregistrement comme participant:', joinError);
        }

        // Récupérer les autres utilisateurs dans cette réunion
        const { users, error: usersError } = await getAllUsersInMeeting(roomId);
        
        if (usersError) {
          console.error('Erreur lors de la récupération des utilisateurs:', usersError);
        } else if (users) {
          // Filtrer l'utilisateur actuel
          const otherUserIds = users
            .filter((u: { user_id: string }) => u.user_id !== user.id)
            .map((u: { user_id: string }) => u.user_id + '-' + roomId);
          
          setOtherUsers(otherUserIds);
          console.log('Autres utilisateurs dans la réunion:', otherUserIds);
        }
      } catch (err: any) {
        console.error('Erreur lors de la récupération des détails de la réunion:', err);
        setError(err.message || 'Une erreur est survenue');
        navigate('/dashboard');
      }
    };
    
    fetchMeetingAndUsers();

    // Rafraîchir la liste des utilisateurs toutes les 10 secondes
    const refreshInterval = setInterval(async () => {
      try {
        const { users } = await getAllUsersInMeeting(roomId);
        if (users) {
          const otherUserIds = users
            .filter((u: { user_id: string }) => u.user_id !== user.id)
            .map((u: { user_id: string }) => u.user_id + '-' + roomId);
          
          // Seulement mettre à jour si la liste a changé
          if (JSON.stringify(otherUserIds) !== JSON.stringify(otherUsers)) {
            console.log('Mise à jour des utilisateurs détectée:', otherUserIds);
            setOtherUsers(otherUserIds);
          }
        }
      } catch (err) {
        console.error('Erreur lors du rafraîchissement des utilisateurs:', err);
      }
    }, 10000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, [roomId, user, navigate, otherUsers]);

  // Initialisation du flux vidéo local
  useEffect(() => {
    if (!user) return;
    
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        setLocalStream(stream);
        setLoading(false);
      } catch (err: any) {
        console.error('Erreur lors de l\'accès à la caméra/micro:', err);
        setError('Impossible d\'accéder à votre caméra ou microphone');
        setLoading(false);
      }
    };

    initializeMedia();

    return () => {
      // Nettoyage du flux local
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [user]);

  // Appel des autres participants
  const callOtherUsers = useCallback(async (newPeer: any, localMediaStream: MediaStream) => {
    if (!otherUsers.length) return;
    
    console.log(`Appel des ${otherUsers.length} autres utilisateurs...`);
    
    for (const remotePeerId of otherUsers) {
      try {
        console.log('Appel de l\'utilisateur:', remotePeerId);
        await callPeer(newPeer, remotePeerId, localMediaStream);
      } catch (err) {
        console.error(`Erreur lors de l'appel à ${remotePeerId}:`, err);
      }
    }
  }, [otherUsers]);

  // Initialisation de PeerJS et connexion des pairs
  useEffect(() => {
    if (!user || !localStream || !roomId) return;

    console.log("Initialisation PeerJS avec les paramètres:", {
      userId: user.id,
      roomId,
      hasLocalStream: !!localStream,
      otherUsersCount: otherUsers.length
    });

    const setupPeer = async () => {
      try {
        // Initialiser le peer avec l'ID de l'utilisateur
        const peerId = user.id + '-' + roomId;
        console.log("Création du peer avec ID:", peerId);
        const newPeer = await initializePeer(peerId);
        
        if (!newPeer) {
          throw new Error('Erreur lors de l\'initialisation de PeerJS');
        }
        
        console.log("Peer créé avec succès:", newPeer.id);
        setPeer(newPeer);
        
        // Écouter les connexions entrantes
        console.log("Configuration des écouteurs de connexion entrante");
        listenToConnections(newPeer, (userId: string, stream: MediaStream) => {
          console.log('Nouvelle connexion entrante détectée de:', userId);
          
          if (stream) {
            console.log(`Le stream entrant de ${userId} a ${stream.getTracks().length} pistes`);
            
            setRemoteStreams(prev => {
              // Vérifier si ce stream existe déjà
              const exists = prev.some(item => item.id === userId);
              
              if (!exists) {
                console.log(`Ajout d'un nouveau stream distant de ${userId}`);
                // Si c'est le premier participant distant, le définir comme actif
                if (prev.length === 0) {
                  console.log(`Définition de ${userId} comme participant actif`);
                  setActiveParticipant(userId);
                }
                return [...prev, { id: userId, stream }];
              }
              
              return prev;
            });
          } else {
            console.warn(`Stream reçu de ${userId} est nul!`);
          }
        });
        
        // Définir le participant local comme actif par défaut
        if (!activeParticipant) {
          console.log("Définition du participant local comme actif par défaut");
          setActiveParticipant('local');
        }
        
        // Appeler les autres utilisateurs dans la réunion
        if (otherUsers.length > 0) {
          console.log(`Appel des ${otherUsers.length} autres utilisateurs dans la réunion`);
          callOtherUsers(newPeer, localStream);
        } else {
          console.log("Aucun autre utilisateur à appeler pour le moment");
        }
      } catch (err: any) {
        console.error('Erreur lors de l\'initialisation de PeerJS:', err);
        setError('Erreur lors de la connexion au service vidéo');
      }
    };
    
    setupPeer();
    
    return () => {
      // Nettoyer les ressources PeerJS lors du démontage du composant
      if (peer) {
        try {
          // Déconnecter de tous les pairs
          console.log("Nettoyage des ressources PeerJS");
          disconnectFromPeer(peer);
        } catch (err) {
          console.error('Erreur lors de la déconnexion du peer:', err);
        }
      }
    };
  }, [user, localStream, roomId, otherUsers, callOtherUsers]);

  // Toggle mute/unmute audio
  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  // Toggle video on/off
  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  // Quitter la réunion
  const handleLeaveRoom = () => {
    try {
      // Arrêter les flux médias locaux
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      // Déconnecter du service peer
      if (peer) {
        disconnectFromPeer(peer);
      }
      
      // Nettoyer les flux distants
      setRemoteStreams([]);
      
      // Rediriger vers le dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Forcer la redirection même en cas d'erreur
      navigate('/dashboard', { replace: true });
    }
  };

  // Sélectionner un participant actif
  const handleSelectParticipant = (id: string) => {
    setActiveParticipant(id);
  };

  // Basculer l'affichage du chat
  const toggleChat = () => {
    setShowChat(!showChat);
  };

  // Gérer une notification d'accès à la réunion
  const handleAccessRequest = (userId: string, accept: boolean) => {
    console.log(`Demande d'accès ${accept ? 'acceptée' : 'refusée'} pour ${userId}`);
    setIncomingMessage(null);
  };

  // Récupérer le flux principal selon le participant actif
  const getMainStream = () => {
    if (activeParticipant === 'local') {
      return localStream;
    } else if (activeParticipant) {
      const selectedStream = remoteStreams.find(s => s.id === activeParticipant);
      return selectedStream ? selectedStream.stream : null;
    }
    return null;
  };

  // Obtenir le nom d'utilisateur pour l'affichage
  const getUserDisplayName = (userId: string) => {
    if (userId === 'local') {
      return user?.email?.split('@')[0] || 'Vous';
    }
    
    // Extraire le nom d'utilisateur de l'ID (supprime le suffixe de roomId)
    return userId.split('-')[0] || 'Participant';
  };

  // Obtenir tous les participants (local + distants)
  const getAllParticipants = (): Participant[] => {
    const participants: Participant[] = [];
    
    // Ajouter le participant local
    if (localStream) {
      participants.push({
        id: 'local',
        stream: localStream,
        name: getUserDisplayName('local')
      });
    }
    
    // Ajouter les participants distants
    remoteStreams.forEach(remote => {
      participants.push({
        id: remote.id,
        stream: remote.stream,
        name: getUserDisplayName(remote.id)
      });
    });
    
    return participants;
  };

  // Calcul de la hauteur disponible pour la vidéo principale
  const calculateMainVideoHeight = () => {
    // Hauteur de l'écran - (header + galerie + contrôles)
    // 60px pour le header, 80px pour la galerie (avec padding), 80px pour les contrôles
    const minHeight = 400; // Hauteur minimale pour la vidéo
    const availableHeight = windowSize.height - 220;
    return Math.max(availableHeight, minHeight);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-gray-900">
        <div className="flex-grow flex items-center justify-center">
          <div className="text-white text-xl">Chargement de la réunion...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen bg-gray-900">
        <div className="flex-grow flex items-center justify-center">
          <div className="bg-red-500 p-4 rounded-lg text-white max-w-md">
            <h3 className="text-lg font-semibold mb-2">Erreur</h3>
            <p>{error}</p>
            <button 
              onClick={() => navigate('/dashboard')} 
              className="mt-4 bg-white text-red-500 px-4 py-2 rounded hover:bg-gray-100"
            >
              Retour au tableau de bord
            </button>
          </div>
        </div>
      </div>
    );
  }

  const mainStream = getMainStream();
  const allParticipants = getAllParticipants();
  const mainVideoHeight = calculateMainVideoHeight();

  return (
    <div className="flex flex-col h-screen bg-gray-900 overflow-hidden">
      {/* Header avec info de réunion */}
      <div className="bg-gray-800 text-white shadow px-4 py-2 flex justify-between items-center h-14">
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-3 truncate">
              <div className="text-sm truncate">
                {meetingDetails?.name || 'Meeting'}
              </div>
              <div className="text-xs text-gray-400">{meetingTime}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <button className="h-8 w-8 rounded-full overflow-hidden">
              <img 
                src="https://via.placeholder.com/100"
                alt={getUserDisplayName('local')}
                className="h-full w-full object-cover"
              />
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
        {/* Zone principale */}
        <div className={`flex-grow flex flex-col ${showChat ? 'md:w-3/4' : 'w-full'} overflow-hidden`}>
          {/* Galerie des participants */}
          <div className="w-full bg-black p-2 overflow-x-auto flex-shrink-0 h-20">
            <div className="flex space-x-2 h-full">
              {allParticipants.map(participant => (
                <div 
                  key={participant.id}
                  className={`cursor-pointer transition-all rounded-lg h-full ${
                    activeParticipant === participant.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => handleSelectParticipant(participant.id)}
                >
                  <VideoPlayer 
                    stream={participant.stream} 
                    label={participant.name}
                    small
                    muted={participant.id === 'local'}
                    className="h-full aspect-video"
                    isVideoOff={participant.id === 'local' && isVideoOff}
                    userAvatar="https://via.placeholder.com/100"
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* Flux vidéo principal */}
          <div className="flex-grow flex flex-col bg-black overflow-hidden">
            {/* Notifications */}
            {incomingMessage && (
              <div className="absolute top-20 left-0 right-0 flex justify-center z-10">
                <div className="bg-gray-800 rounded-lg shadow-lg p-3 mx-4 max-w-md flex items-center">
                  <div className="mr-3 h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center text-white">
                    {incomingMessage.from.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-grow">
                    <div className="text-sm text-white">{incomingMessage.from}</div>
                    <div className="text-xs text-gray-300">{incomingMessage.text}</div>
                  </div>
                  <div className="flex ml-2">
                    <button 
                      className="bg-blue-500 text-white px-3 py-1 rounded text-xs mr-2"
                      onClick={() => handleAccessRequest(incomingMessage.from, true)}
                    >
                      Accepter
                    </button>
                    <button 
                      className="bg-gray-700 text-white px-3 py-1 rounded text-xs"
                      onClick={() => handleAccessRequest(incomingMessage.from, false)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Vidéo principale */}
            <div className="flex-grow flex items-center justify-center overflow-hidden">
              {mainStream ? (
                <VideoPlayer 
                  stream={mainStream} 
                  label={getUserDisplayName(activeParticipant || 'local')}
                  muted={activeParticipant === 'local'}
                  className="w-full h-full"
                  isVideoOff={activeParticipant === 'local' && isVideoOff}
                  userAvatar="https://via.placeholder.com/100"
                />
              ) : (
                <div className="bg-gray-800 rounded-lg p-8 text-white text-center">
                  <p>Aucune vidéo sélectionnée</p>
                </div>
              )}
            </div>
            
            {/* Barre de contrôles */}
            <div className="p-4 flex justify-center flex-shrink-0">
              <ControlBar
                isMuted={isMuted}
                isVideoOff={isVideoOff}
                onToggleMute={toggleMute}
                onToggleVideo={toggleVideo}
                onDisconnect={handleLeaveRoom}
                onToggleChat={toggleChat}
                isChatOpen={showChat}
                localStream={localStream}
              />
            </div>
          </div>
        </div>
        
        {/* Chat panel - visible en fonction de showChat */}
        {showChat && (
          <div className="w-full md:w-1/4 h-full border-l border-gray-700 flex flex-col overflow-hidden">
            <ChatBox roomId={roomId || ''} darkMode className="h-full" />
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetRoom; 