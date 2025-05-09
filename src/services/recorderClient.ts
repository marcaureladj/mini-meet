/**
 * Service gérant l'enregistrement vidéo au format MP4
 */

/**
 * Interface pour l'options d'enregistrement
 */
export interface RecordingOptions {
  mimeType?: string;
  videoBitsPerSecond?: number;
  audioBitsPerSecond?: number;
}

/**
 * Interface pour un enregistrement
 */
export interface Recording {
  id: string;
  timestamp: number;
  blob: Blob;
  url: string;
  duration: number;
}

/**
 * Classe gérant l'enregistrement
 */
export class VideoRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: BlobPart[] = [];
  private startTime: number = 0;
  private stream: MediaStream | null = null;
  private isRecording: boolean = false;

  /**
   * Vérifie si le navigateur supporte l'enregistrement vidéo
   */
  public static isSupported(): boolean {
    return !!window.MediaRecorder;
  }

  /**
   * Vérifie les formats supportés par le navigateur
   */
  public static getSupportedMimeTypes(): string[] {
    const supportedTypes = [];
    const types = [
      'video/mp4',
      'video/webm',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm;codecs=h264',
      'video/mpeg'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        supportedTypes.push(type);
      }
    }

    return supportedTypes;
  }

  /**
   * Démarre l'enregistrement
   */
  public startRecording(stream: MediaStream, options: RecordingOptions = {}): boolean {
    if (!VideoRecorder.isSupported()) {
      console.error("L'enregistrement vidéo n'est pas supporté par ce navigateur");
      return false;
    }

    try {
      this.stream = stream;
      this.recordedChunks = [];
      
      // Déterminer le type MIME à utiliser
      const supportedTypes = VideoRecorder.getSupportedMimeTypes();
      let mimeType = 'video/webm'; // Type par défaut

      // Privilégier MP4 si supporté
      if (supportedTypes.includes('video/mp4')) {
        mimeType = 'video/mp4';
      } else if (supportedTypes.length > 0) {
        mimeType = supportedTypes[0];
      }

      const recorderOptions: MediaRecorderOptions = {
        mimeType: options.mimeType || mimeType,
        videoBitsPerSecond: options.videoBitsPerSecond || 2500000,
        audioBitsPerSecond: options.audioBitsPerSecond || 128000
      };

      console.log(`Début d'enregistrement avec le format: ${recorderOptions.mimeType}`);
      
      this.mediaRecorder = new MediaRecorder(stream, recorderOptions);
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(1000); // Capture toutes les secondes
      this.startTime = Date.now();
      this.isRecording = true;
      
      return true;
    } catch (error) {
      console.error("Erreur lors du démarrage de l'enregistrement:", error);
      
      // Si le format MP4 a échoué, essayer WebM comme fallback
      if (options.mimeType === 'video/mp4') {
        console.log("Tentative de repli sur WebM...");
        return this.startRecording(stream, { ...options, mimeType: 'video/webm' });
      }
      
      return false;
    }
  }

  /**
   * Arrête l'enregistrement et retourne la vidéo
   */
  public stopRecording(): Promise<Recording> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        reject(new Error("Aucun enregistrement en cours"));
        return;
      }

      // Enregistrer la durée avant d'arrêter
      const duration = (Date.now() - this.startTime) / 1000;

      this.mediaRecorder.onstop = () => {
        try {
          // Déterminer le type MIME approprié
          const mimeType = this.mediaRecorder?.mimeType || 'video/mp4';
          
          // Créer le blob avec le bon type MIME
          const blob = new Blob(this.recordedChunks, { type: mimeType });
          const url = URL.createObjectURL(blob);
          
          const recording: Recording = {
            id: `rec_${Date.now()}`,
            timestamp: this.startTime,
            blob,
            url,
            duration
          };
          
          this.isRecording = false;
          resolve(recording);
        } catch (error) {
          reject(error);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Vérifie si l'enregistrement est en cours
   */
  public isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Télécharge l'enregistrement sous forme de fichier MP4
   */
  public static downloadRecording(recording: Recording, filename: string = `enregistrement_${new Date().toISOString()}`): void {
    // S'assurer que le fichier a une extension .mp4
    if (!filename.endsWith('.mp4')) {
      filename += '.mp4';
    }
    
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = recording.url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Nettoyer
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(recording.url);
    }, 100);
  }

  /**
   * Nettoie les ressources
   */
  public cleanup(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    
    this.recordedChunks = [];
    this.isRecording = false;
  }
}

// Singleton pour l'usage dans l'application
const recorder = new VideoRecorder();
export default recorder; 