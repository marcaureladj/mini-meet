import React, { useState, useRef } from 'react';
import { createMediaRecorder } from '../services/peerClient';

interface RecordButtonProps {
  stream: MediaStream | null;
  className?: string;
}

const RecordButton: React.FC<RecordButtonProps> = ({ stream, className = '' }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const handleStartRecording = () => {
    if (!stream || !stream.active) {
      console.error('Aucun flux disponible pour l\'enregistrement');
      return;
    }

    try {
      // Réinitialiser les données précédentes
      chunksRef.current = [];
      setRecordingUrl(null);
      setRecordingTime(0);

      // Créer un nouvel enregistreur
      const recorder = createMediaRecorder(stream);
      recorderRef.current = recorder;

      // Configurer les gestionnaires d'événements
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordingUrl(url);
        setIsRecording(false);
        
        // Arrêter le timer
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      // Démarrer l'enregistrement
      recorder.start(1000); // Collecter des données toutes les secondes
      setIsRecording(true);

      // Démarrer le timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Erreur lors du démarrage de l\'enregistrement:', err);
    }
  };

  const handleStopRecording = () => {
    if (recorderRef.current && isRecording) {
      recorderRef.current.stop();
    }
  };

  const handleDownload = () => {
    if (recordingUrl) {
      const a = document.createElement('a');
      a.href = recordingUrl;
      a.download = `minimeet-recording-${new Date().toISOString()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Formater le temps d'enregistrement (mm:ss)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center ${className}`}>
      {isRecording ? (
        <>
          <span className="text-red-500 animate-pulse mr-2">● {formatTime(recordingTime)}</span>
          <button
            onClick={handleStopRecording}
            className="flex items-center justify-center p-3 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
            title="Arrêter l'enregistrement"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
              />
            </svg>
          </button>
        </>
      ) : (
        <>
          <button
            onClick={handleStartRecording}
            disabled={!stream || !stream.active}
            className={`flex items-center justify-center p-3 rounded-full 
              ${!stream || !stream.active 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-red-500 hover:bg-red-600 text-white'
              } transition-colors`}
            title={!stream || !stream.active ? 'Flux non disponible' : 'Démarrer l\'enregistrement'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </button>
          
          {recordingUrl && (
            <button
              onClick={handleDownload}
              className="flex items-center justify-center p-3 ml-2 rounded-full bg-primary hover:bg-blue-600 text-white transition-colors"
              title="Télécharger l'enregistrement"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default RecordButton; 