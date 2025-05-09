import React, { useState, useEffect, useRef } from 'react';
import recorder, { VideoRecorder, type Recording } from '../services/recorderClient';

interface ControlBarProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isChatOpen: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onDisconnect: () => void;
  onToggleChat: () => void;
  localStream: MediaStream | null;
}

const ControlBar: React.FC<ControlBarProps> = ({
  isMuted,
  isVideoOff,
  isChatOpen,
  onToggleMute,
  onToggleVideo,
  onDisconnect,
  onToggleChat,
  localStream
}) => {
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentRecording, setCurrentRecording] = useState<Recording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null);
  const [supportedFormats, setSupportedFormats] = useState<string[]>([]);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  // Vérifier le support de l'enregistrement au chargement
  useEffect(() => {
    const isSupported = VideoRecorder.isSupported();
    const formats = isSupported ? 
      VideoRecorder.getSupportedMimeTypes() : 
      [];
    
    setSupportedFormats(formats);
    
    if (!isSupported) {
      setRecordingError("L'enregistrement n'est pas supporté par votre navigateur");
    } else if (!formats.includes('video/mp4') && !formats.includes('video/webm')) {
      setRecordingError("Les formats d'enregistrement compatibles ne sont pas disponibles");
    }
    
    // La fonction de retour de useEffect capture les valeurs de isRecording et recordingTimer
    // au moment de l'exécution de l'effet (au montage).
    // Pour le nettoyage au démontage, nous avons besoin des valeurs actuelles.
    // Cependant, isRecording et recordingTimer sont déjà gérés dans toggleRecording pour l'arrêt.
    // Le principal ici est le cleanup de recorder si l'enregistrement était actif au démontage.
    // Et le nettoyage du timer s'il existait au démontage.
    const timerRef = useRef(recordingTimer); // Utiliser une ref pour le timer
    timerRef.current = recordingTimer;
    const isRecordingRef = useRef(isRecording);
    isRecordingRef.current = isRecording;

    return () => {
      // Nettoyer l'enregistrement et le timer à la fermeture
      if (isRecordingRef.current) {
        recorder.cleanup();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []); // Exécuter seulement au montage et au démontage
  
  // Simulation du partage d'écran
  const toggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
  };
  
  // Gestion de l'enregistrement
  const toggleRecording = async () => {
    if (!localStream) {
      setRecordingError("Aucun flux vidéo disponible pour l'enregistrement");
      return;
    }
    
    if (isRecording) {
      // Arrêter l'enregistrement
      try {
        const recording = await recorder.stopRecording();
        setCurrentRecording(recording);
        setIsRecording(false);
        
        // Arrêter le timer
        if (recordingTimer) {
          clearInterval(recordingTimer);
          setRecordingTimer(null);
        }
        
        // Télécharger automatiquement
        const meetingName = 'MiniMeet';
        VideoRecorder.downloadRecording(recording, `${meetingName}_${new Date().toLocaleDateString()}`);
      } catch (error) {
        console.error("Erreur lors de l'arrêt de l'enregistrement:", error);
        setRecordingError("Erreur lors de l'arrêt de l'enregistrement");
      }
    } else {
      // Démarrer l'enregistrement
      try {
        // Déterminer le type MIME à privilégier
        const preferredMimeType = supportedFormats.includes('video/mp4') ? 'video/mp4' : 'video/webm';
        
        // Essayer d'enregistrer en MP4 d'abord
        const success = recorder.startRecording(localStream, {
          mimeType: preferredMimeType,
          videoBitsPerSecond: 2500000,  // 2.5 Mbps
          audioBitsPerSecond: 128000    // 128 kbps
        });
        
        if (success) {
          setIsRecording(true);
          setRecordingDuration(0);
          setRecordingError(null);
          
          // Démarrer le timer pour afficher la durée
          const timer = setInterval(() => {
            setRecordingDuration(prev => prev + 1);
          }, 1000);
          
          setRecordingTimer(timer);
        } else {
          setRecordingError("Impossible de démarrer l'enregistrement");
        }
      } catch (error) {
        console.error("Erreur lors du démarrage de l'enregistrement:", error);
        setRecordingError("Erreur lors du démarrage de l'enregistrement");
      }
    }
  };
  
  // Formatage de la durée d'enregistrement
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="flex flex-col items-center">
      {/* Indicateur d'enregistrement */}
      {isRecording && (
        <div className="mb-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs flex items-center">
          <div className="h-2 w-2 rounded-full bg-white animate-pulse mr-2"></div>
          Enregistrement en cours: {formatDuration(recordingDuration)}
        </div>
      )}
      
      {/* Message d'erreur */}
      {recordingError && !isRecording && (
        <div className="mb-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs">
          {recordingError}
        </div>
      )}
      
      <div className="flex items-center justify-center space-x-2 md:space-x-3">
        {/* Bouton Micro */}
        <button
          onClick={onToggleMute}
          className={`h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-colors ${
            isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
          }`}
          title={isMuted ? 'Activer le micro' : 'Couper le micro'}
        >
          {isMuted ? (
            <svg className="h-5 w-5 md:h-6 md:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
            </svg>
          ) : (
            <svg className="h-5 w-5 md:h-6 md:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </button>

        {/* Bouton Caméra */}
        <button
          onClick={onToggleVideo}
          className={`h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-colors ${
            isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
          }`}
          title={isVideoOff ? 'Activer la caméra' : 'Désactiver la caméra'}
        >
          {isVideoOff ? (
            <svg className="h-5 w-5 md:h-6 md:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
            </svg>
          ) : (
            <svg className="h-5 w-5 md:h-6 md:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>

        {/* Bouton Partage d'écran */}
        <button
          onClick={toggleScreenShare}
          className={`h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-colors ${
            isScreenSharing ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'
          }`}
          title={isScreenSharing ? 'Arrêter le partage' : 'Partager l\'écran'}
        >
          <svg className="h-5 w-5 md:h-6 md:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </button>

        {/* Bouton Enregistrement */}
        <button
          onClick={toggleRecording}
          disabled={!localStream || !!recordingError}
          className={`h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-colors ${
            isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
          } ${(!localStream || !!recordingError) ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isRecording ? 'Arrêter l\'enregistrement (MP4)' : 'Démarrer l\'enregistrement (MP4)'}
        >
          <svg className="h-5 w-5 md:h-6 md:w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            {isRecording ? (
              <rect x="6" y="6" width="12" height="12" strokeWidth="2" stroke="white" fill="white" />
            ) : (
              <circle cx="12" cy="12" r="5" strokeWidth="2" stroke="white" fill={isRecording ? "white" : "none"} />
            )}
          </svg>
        </button>

        {/* Bouton Chat */}
        <button
          onClick={onToggleChat}
          className={`h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center transition-colors ${
            isChatOpen ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-blue-500 hover:bg-blue-600'
          }`}
          title={isChatOpen ? 'Fermer le chat' : 'Ouvrir le chat'}
        >
          <svg className="h-5 w-5 md:h-6 md:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>

        {/* Bouton Options supplémentaires */}
        <div className="relative">
          <button
            onClick={() => setShowMoreOptions(!showMoreOptions)}
            className="h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center bg-blue-500 hover:bg-blue-600 transition-colors"
            title="Plus d'options"
          >
            <svg className="h-5 w-5 md:h-6 md:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
          </button>
          
          {showMoreOptions && (
            <div className="absolute bottom-full mb-2 right-0 bg-gray-800 rounded-lg shadow-lg py-2 w-56">
              {currentRecording && (
                <button 
                  className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 text-sm flex items-center"
                  onClick={() => VideoRecorder.downloadRecording(currentRecording, `MiniMeet_${new Date().toLocaleDateString()}`)}
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Télécharger l'enregistrement
                </button>
              )}
             
       
    
              <div className="border-t border-gray-700 my-1"></div>
         
              </div>
          )}
        </div>

        {/* Bouton Raccrocher */}
        <button
          onClick={onDisconnect}
          className="h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 transition-colors"
          title="Quitter la réunion"
        >
          <svg className="h-5 w-5 md:h-6 md:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ControlBar; 