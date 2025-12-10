/**
 * Service de transcription audio en temps réel avec OpenAI Whisper
 */

const BASE_URL = '/api';

export interface TranscriptionOptions {
  onTranscript?: (text: string) => void;
  onError?: (error: Error) => void;
  onEnd?: () => void;
  continuous?: boolean; // Transcription continue
}

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let isRecording = false;

/**
 * Démarre l'enregistrement audio et la transcription
 */
export async function startAudioTranscription(options: TranscriptionOptions = {}): Promise<void> {
  try {
    // Demander l'accès au microphone
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Créer le MediaRecorder
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    isRecording = true;
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };
    
    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      audioChunks = [];
      
      // Envoyer l'audio pour transcription
      try {
        const text = await transcribeAudio(audioBlob);
        if (options.onTranscript) {
          options.onTranscript(text);
        }
        
        // Si mode continu, redémarrer l'enregistrement
        if (options.continuous && isRecording) {
          mediaRecorder?.start();
        } else {
          // Arrêter le stream
          stream.getTracks().forEach(track => track.stop());
          if (options.onEnd) {
            options.onEnd();
          }
        }
      } catch (error) {
        console.error('Erreur de transcription:', error);
        if (options.onError) {
          options.onError(error as Error);
        }
      }
    };
    
    // Démarrer l'enregistrement
    mediaRecorder.start();
    
    // Si mode continu, arrêter et redémarrer toutes les 3 secondes
    if (options.continuous) {
      const intervalId = setInterval(() => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        } else {
          clearInterval(intervalId);
        }
      }, 3000);
    }
    
  } catch (error) {
    console.error('Erreur d\'accès au microphone:', error);
    if (options.onError) {
      options.onError(error as Error);
    }
  }
}

/**
 * Arrête l'enregistrement audio
 */
export function stopAudioTranscription(): void {
  isRecording = false;
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }
}

/**
 * Transcrit un fichier audio avec OpenAI Whisper
 */
async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'audio.webm');
  
  const response = await fetch(`${BASE_URL}/transcribe`, {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    throw new Error(`Erreur de transcription: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.text || '';
}

/**
 * Vérifie si l'enregistrement est en cours
 */
export function isRecordingAudio(): boolean {
  return isRecording && mediaRecorder !== null && mediaRecorder.state === 'recording';
}

export default {
  start: startAudioTranscription,
  stop: stopAudioTranscription,
  isRecording: isRecordingAudio
};
