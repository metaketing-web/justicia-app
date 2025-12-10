/**
 * Service de synthèse vocale utilisant l'API OpenAI TTS
 * Remplace la voix robotique par une voix naturelle
 */

// Utiliser le backend au lieu d'appeler directement OpenAI
const BASE_URL = '/api';

export type TTSVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' | 'cedar' | 'marin';

let currentAudio: HTMLAudioElement | null = null;

/**
 * Convertit du texte en parole avec une voix naturelle OpenAI
 */
export async function speakTextWithOpenAI(
  text: string,
  onEnd?: () => void,
  voice: TTSVoice = 'cedar'
): Promise<void> {
  try {
    // Arrêter l'audio en cours
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    
    // Limiter la longueur du texte (OpenAI TTS max 4096 caractères)
    if (text.length > 4000) {
      text = text.substring(0, 4000) + '...';
    }
    
    // Vérifier que le texte n'est pas vide
    if (!text || text.trim().length === 0) {
      console.warn('Texte vide, pas de TTS');
      if (onEnd) onEnd();
      return;
    }

    // Appeler l'API TTS via le backend
    const response = await fetch(`${BASE_URL}/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        voice: voice
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur API TTS: ${response.statusText}`);
    }

    // Convertir la réponse en blob audio
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    // Créer et jouer l'élément audio
    currentAudio = new Audio(audioUrl);
    
    currentAudio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      if (onEnd) onEnd();
    };

    currentAudio.onerror = (error) => {
      console.error('Erreur de lecture audio:', error);
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      if (onEnd) onEnd();
    };

    await currentAudio.play();
    
  } catch (error) {
    console.error('Erreur TTS OpenAI:', error);
    alert('Erreur audio OpenAI. Vérifiez votre connexion.');
    if (onEnd) onEnd();
  }
}

/**
 * Arrête la lecture audio en cours
 */
export function stopSpeakingOpenAI(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

// Fallback supprimé - Utilisation exclusive de l'API OpenAI TTS

/**
 * Vérifie si l'audio est en cours de lecture
 */
export function isSpeakingOpenAI(): boolean {
  return currentAudio !== null && !currentAudio.paused;
}

export default {
  speak: speakTextWithOpenAI,
  stop: stopSpeakingOpenAI,
  isSpeaking: isSpeakingOpenAI
};

