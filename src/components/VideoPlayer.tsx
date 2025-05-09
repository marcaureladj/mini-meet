import React, { useRef, useEffect } from 'react';

interface VideoPlayerProps {
  stream: MediaStream | null;
  muted?: boolean;
  label?: string;
  className?: string;
  small?: boolean;
  isVideoOff?: boolean;
  userAvatar?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  stream,
  muted = false,
  label = '',
  className = '',
  small = false,
  isVideoOff = false,
  userAvatar = ''
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    try {
      // Détacher l'ancien stream si présent
      if (videoElement.srcObject) {
        videoElement.srcObject = null;
      }

      // Attacher le nouveau stream s'il existe
      if (stream) {
        videoElement.srcObject = stream;
        videoElement.play().catch(err => {
          console.error('Erreur lors de la lecture de la vidéo:', err);
        });
      }
    } catch (err) {
      console.error('Erreur lors de l\'attachement du stream à la vidéo:', err);
    }

    // Cleanup function
    return () => {
      if (videoElement && videoElement.srcObject) {
        videoElement.srcObject = null;
      }
    };
  }, [stream]);

  const containerClasses = small 
    ? `${className} relative rounded-lg overflow-hidden bg-gray-800 shadow-md`
    : `${className} relative rounded-lg overflow-hidden bg-black flex items-center justify-center`;

  const videoClasses = small
    ? 'h-full w-full object-cover'
    : 'h-full w-full object-contain';

  const labelClasses = small
    ? 'absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white px-2 py-0.5 text-xs truncate'
    : 'absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1.5 rounded-md text-sm font-medium';

  return (
    <div className={containerClasses}>
      {stream && !isVideoOff ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={videoClasses}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800">
          {userAvatar ? (
            <div className={`${small ? 'h-12 w-12' : 'h-24 w-24'} rounded-full overflow-hidden mb-2`}>
              <img 
                src={userAvatar} 
                alt={label || "Utilisateur"} 
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="text-gray-400">
              <svg className={`${small ? 'h-8 w-8' : 'h-16 w-16'} mx-auto`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <p className={`mt-2 text-center ${small ? 'text-xs' : 'text-sm'} text-gray-300`}>
            {isVideoOff ? "Caméra désactivée" : "Vidéo indisponible"}
          </p>
        </div>
      )}
      
      {label && (
        <div className={labelClasses}>
          {label}
        </div>
      )}
    </div>
  );
};

export default VideoPlayer; 