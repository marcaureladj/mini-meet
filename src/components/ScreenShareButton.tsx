import React from 'react';
import { getScreenShareStream, stopMediaStream } from '../services/peerClient';

interface ScreenShareButtonProps {
  isSharing: boolean;
  onScreenShare: (stream: MediaStream | null) => void;
  className?: string;
}

const ScreenShareButton: React.FC<ScreenShareButtonProps> = ({
  isSharing,
  onScreenShare,
  className = ''
}) => {
  const handleToggleScreenShare = async () => {
    try {
      if (isSharing) {
        // Arrêter le partage d'écran
        onScreenShare(null);
      } else {
        // Démarrer le partage d'écran
        const screenStream = await getScreenShareStream();
        
        // Écouter l'événement de fin de partage d'écran
        screenStream.getVideoTracks()[0].addEventListener('ended', () => {
          onScreenShare(null);
        });
        
        onScreenShare(screenStream);
      }
    } catch (err) {
      console.error('Erreur lors du partage d\'écran:', err);
    }
  };

  return (
    <button
      onClick={handleToggleScreenShare}
      className={`flex items-center justify-center p-3 rounded-full 
        ${isSharing 
          ? 'bg-red-500 hover:bg-red-600 text-white' 
          : 'bg-primary hover:bg-blue-600 text-white'
        } transition-colors ${className}`}
      title={isSharing ? 'Arrêter le partage d\'écran' : 'Partager l\'écran'}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        {isSharing ? (
          // Icône d'arrêt de partage
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
          />
        ) : (
          // Icône de partage d'écran
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        )}
      </svg>
    </button>
  );
};

export default ScreenShareButton; 