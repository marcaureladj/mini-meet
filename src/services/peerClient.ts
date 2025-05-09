import Peer from 'peerjs';
import type { DataConnection, MediaConnection } from 'peerjs';
import { v4 as uuidv4 } from 'uuid';

// Configuration par défaut pour PeerJS
const DEFAULT_CONFIG = {
  // Utiliser le serveur PeerJS par défaut qui ne nécessite pas d'hôte spécifique
  secure: true,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ],
    iceCandidatePoolSize: 10
  },
  debug: process.env.NODE_ENV === 'development' ? 2 : 0
};

/**
 * Crée une nouvelle instance Peer avec un ID spécifique ou génère un ID aléatoire
 * @param {string} peerId - ID du peer (optionnel)
 * @param {object} config - Configuration PeerJS (optionnel)
 * @returns {Peer} - Instance Peer
 */
export const createPeer = (peerId: string | null = null, config = {}): Peer => {
  // On ajoute un suffixe aléatoire pour éviter les conflits d'ID
  const uniqueSuffix = `-${Math.random().toString(36).substr(2, 9)}`;
  const id = peerId ? `${peerId}${uniqueSuffix}` : uuidv4();
  
  console.log('Création d\'un peer avec ID:', id);
  const peer = new Peer(id, { ...DEFAULT_CONFIG, ...config });
  
  // Ajouter des logs pour suivre les états de connexion
  peer.on('open', () => console.log('PeerJS: Connexion établie avec ID:', id));
  peer.on('disconnected', () => {
    console.log('PeerJS: Déconnecté, tentative de reconnexion...');
    setTimeout(() => {
      if (peer && !peer.destroyed) {
        peer.reconnect();
      }
    }, 3000);
  });
  peer.on('close', () => console.log('PeerJS: Connexion fermée'));
  peer.on('error', (err) => {
    console.error('PeerJS Error:', err);
    if (err.toString().includes('Could not connect to peer') || 
        err.toString().includes('Lost connection to server')) {
      setTimeout(() => {
        if (peer && !peer.destroyed) {
          peer.reconnect();
        }
      }, 3000);
    }
  });
  
  return peer;
};

/**
 * Établit une connexion de données avec un peer distant
 * @param {Peer} peer - Instance Peer locale
 * @param {string} remotePeerId - ID du peer distant
 * @returns {DataConnection} - Connexion de données
 */
export const connectToPeer = (peer: Peer, remotePeerId: string): DataConnection => {
  return peer.connect(remotePeerId);
};

/**
 * Établit une connexion média avec un peer distant
 * @param {Peer} peer - Instance Peer locale
 * @param {string} remotePeerId - ID du peer distant
 * @param {MediaStream} stream - Flux média local
 * @returns {MediaConnection} - Connexion média
 */
export const callPeer = (peer: Peer, remotePeerId: string, stream: MediaStream): MediaConnection => {
  console.log(`Tentative d'appel au peer distant: ${remotePeerId} depuis ${peer.id}`);
  
  if (!stream) {
    console.error("callPeer: Aucun stream média fourni");
    throw new Error("Impossible d'appeler sans stream média");
  }
  
  if (!stream.active) {
    console.warn("callPeer: Le stream fourni n'est pas actif");
  }
  
  // Vérifier que le flux a bien des pistes audio/vidéo
  const hasTracks = stream.getTracks().length > 0;
  console.log(`Le stream local a ${stream.getTracks().length} pistes`);
  
  if (!hasTracks) {
    console.warn("callPeer: Le stream ne contient aucune piste audio/vidéo");
  }
  
  try {
    // Établir l'appel
    const call = peer.call(remotePeerId, stream);
    
    if (!call) {
      throw new Error(`Échec de l'appel à ${remotePeerId}: null call returned`);
    }
    
    console.log(`Appel initié vers ${remotePeerId}`, call);
    
    // Ajouter des gestionnaires d'événements pour le suivi
    call.on('stream', (remoteStream) => {
      console.log(`Stream reçu de ${remotePeerId}`, remoteStream);
    });
    
    call.on('close', () => {
      console.log(`Appel avec ${remotePeerId} fermé`);
    });
    
    call.on('error', (err) => {
      console.error(`Erreur dans l'appel avec ${remotePeerId}:`, err);
    });
    
    return call;
  } catch (error) {
    console.error(`Erreur lors de l'appel à ${remotePeerId}:`, error);
    throw error;
  }
};

/**
 * Récupère un flux média local (audio/vidéo)
 * @param {MediaStreamConstraints} constraints - Contraintes pour getUserMedia
 * @returns {Promise<MediaStream>} - Flux média
 */
export const getLocalStream = async (constraints: MediaStreamConstraints = { video: true, audio: true }): Promise<MediaStream> => {
  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (error: any) {
    console.error('Erreur lors de l\'accès aux périphériques média:', error);
    
    // Si la caméra n'est pas disponible, essayons avec l'audio uniquement
    if (error.name === 'NotFoundError' || error.name === 'NotReadableError' || error.name === 'OverconstrainedError') {
      console.log('Tentative de connexion avec audio uniquement...');
      try {
        return await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      } catch (audioError) {
        console.error('Erreur lors de l\'accès au micro:', audioError);
        throw audioError;
      }
    }
    
    throw error;
  }
};

/**
 * Récupère un flux de partage d'écran
 * @returns {Promise<MediaStream>} - Flux de partage d'écran
 */
export const getScreenShareStream = async (): Promise<MediaStream> => {
  try {
    return await navigator.mediaDevices.getDisplayMedia({ video: true });
  } catch (error) {
    console.error('Erreur lors du partage d\'écran:', error);
    throw error;
  }
};

/**
 * Enregistre un flux média
 * @param {MediaStream} stream - Flux à enregistrer
 * @returns {MediaRecorder} - Enregistreur média
 */
export const createMediaRecorder = (stream: MediaStream): MediaRecorder => {
  const options = { mimeType: 'video/webm' };
  try {
    return new MediaRecorder(stream, options);
  } catch (error) {
    console.error('Erreur lors de la création de l\'enregistreur:', error);
    throw error;
  }
};

/**
 * Arrête tous les tracks d'un flux média
 * @param {MediaStream} stream - Flux média à arrêter
 */
export const stopMediaStream = (stream: MediaStream | null): void => {
  if (!stream) return;
  stream.getTracks().forEach(track => track.stop());
};

/**
 * Initialise un peer avec un ID spécifique et gère les tentatives de reconnexion
 * @param {string} peerId - ID du peer
 * @returns {Promise<Peer>} - Instance Peer initialisée
 */
export const initializePeer = (peerId: string): Promise<Peer> => {
  return new Promise((resolve, reject) => {
    try {
      const peer = createPeer(peerId);
      let reconnectAttempts = 0;
      const maxReconnectAttempts = 5;
      
      // Fonction pour calculer le délai de backoff exponentiel
      const getBackoffDelay = (attempt: number) => Math.min(1000 * Math.pow(2, attempt), 30000);
      
      // Fonction pour tenter de reconnecter avec backoff exponentiel
      const reconnectWithBackoff = () => {
        if (reconnectAttempts >= maxReconnectAttempts) {
          console.error(`Échec après ${maxReconnectAttempts} tentatives de reconnexion`);
          return;
        }
        
        const delay = getBackoffDelay(reconnectAttempts);
        console.log(`Tentative de reconnexion dans ${delay/1000} secondes...`);
        
        setTimeout(() => {
          reconnectAttempts++;
          if (peer && !peer.destroyed) {
            peer.reconnect();
          }
        }, delay);
      };
      
      // Attendre que la connexion soit établie
      peer.on('open', () => {
        resolve(peer);
        // Réinitialiser le compteur de tentatives après une connexion réussie
        reconnectAttempts = 0;
      });
      
      // Gérer les déconnexions
      peer.on('disconnected', () => {
        console.log('PeerJS: Déconnecté, tentative de reconnexion...');
        reconnectWithBackoff();
      });
      
      // Gérer les erreurs d'initialisation
      peer.on('error', (error) => {
        // Ne rejetons pas la promesse si c'est juste une déconnexion temporaire
        if (error.toString().includes('Could not connect to peer') || 
            error.toString().includes('Lost connection to server')) {
          console.warn('Erreur de connexion PeerJS:', error);
          reconnectWithBackoff();
        } else {
          reject(error);
        }
      });
      
      // Timeout au cas où la connexion prend trop de temps
      setTimeout(() => {
        if (peer.id) {
          resolve(peer); // Le peer a un ID, donc considéré comme connecté
        } else {
          reject(new Error('Timeout lors de l\'initialisation du peer'));
        }
      }, 10000);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Écoute les connexions entrantes (appels et connexions de données)
 * @param {Peer} peer - Instance Peer locale
 * @param {Function} onConnection - Callback appelé lors d'une nouvelle connexion
 */
export const listenToConnections = (
  peer: Peer, 
  onConnection: (userId: string, stream: MediaStream) => void
): void => {
  // S'assurer que l'écouteur n'est pas déjà attaché
  peer.off('call');
  
  // Écouter les appels entrants
  peer.on('call', (call) => {
    console.log('Appel entrant de:', call.peer);
    
    // Répondre automatiquement avec notre flux local
    getLocalStream()
      .then((localStream) => {
        console.log(`Réponse à l'appel de ${call.peer} avec notre flux local`);
        console.log(`Notre flux local a ${localStream.getTracks().length} pistes`);
        
        // Activer les pistes si nécessaire
        localStream.getTracks().forEach(track => {
          if (!track.enabled) {
            console.log(`Activation de la piste ${track.kind} pour la réponse d'appel`);
            track.enabled = true;
          }
        });
        
        // Répondre à l'appel avec notre flux
        call.answer(localStream);
        
        // Écouter le flux distant
        call.once('stream', (remoteStream) => {
          console.log(`Flux distant reçu de: ${call.peer}`);
          console.log(`Le flux distant a ${remoteStream.getTracks().length} pistes`);
          
          // Vérifier si le stream a des pistes actives
          if (remoteStream.getTracks().length === 0) {
            console.warn(`Le flux reçu de ${call.peer} n'a pas de pistes`);
            return;
          }
          
          // Notifier le composant parent avec l'ID de l'appelant et son flux
          onConnection(call.peer, remoteStream);
        });
        
        // Gérer les erreurs sur l'appel
        call.on('error', (err) => {
          console.error(`Erreur dans l'appel avec ${call.peer}:`, err);
        });
        
        // Suivi de la fermeture de l'appel
        call.on('close', () => {
          console.log(`Appel avec ${call.peer} fermé`);
        });
      })
      .catch((error) => {
        console.error('Erreur lors de la réponse à l\'appel:', error);
      });
  });
  
  // Écouter les connexions de données entrantes
  peer.on('connection', (conn) => {
    console.log('Connexion de données entrante de:', conn.peer);
    
    conn.on('open', () => {
      console.log('Canal de données ouvert avec:', conn.peer);
      
      // Envoyer un message pour confirmer la connexion
      conn.send({ type: 'connection_established', from: peer.id });
    });
    
    conn.on('data', (data) => {
      console.log('Données reçues de', conn.peer, ':', data);
    });
    
    conn.on('error', (err) => {
      console.error(`Erreur dans la connexion de données avec ${conn.peer}:`, err);
    });
    
    conn.on('close', () => {
      console.log(`Connexion de données avec ${conn.peer} fermée`);
    });
  });
};

/**
 * Déconnecte un peer et nettoie les ressources
 * @param {Peer} peer - Instance Peer à déconnecter
 */
export const disconnectFromPeer = (peer: Peer): void => {
  if (!peer) return;
  
  try {
    // Fermer toutes les connexions
    if (peer.connections) {
      Object.values(peer.connections).forEach((connections: any) => {
        connections.forEach((connection: any) => {
          if (connection && typeof connection.close === 'function') {
            connection.close();
          }
        });
      });
    }
    
    // Fermer le peer lui-même
    if (!peer.destroyed) {
      peer.destroy();
    }
    
    console.log('Peer déconnecté et ressources nettoyées');
  } catch (error) {
    console.error('Erreur lors de la déconnexion du peer:', error);
  }
}; 