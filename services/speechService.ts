// Text-to-Speech (TTS) avec OpenAI TTS API
import { speakTextWithOpenAI, stopSpeakingOpenAI } from './openai-tts.service';

export async function speakText(text: string, onEnd?: () => void, _voice?: SpeechSynthesisVoice) {
  try {
    // Utiliser OpenAI TTS avec la voix "nova" (voix féminine française naturelle)
    // Le paramètre _voice (SpeechSynthesisVoice du navigateur) est ignoré car on utilise OpenAI
    await speakTextWithOpenAI(text, onEnd, 'nova');
  } catch (error) {
    console.error('[speechService] Erreur TTS:', error);
    if (onEnd) {
      onEnd();
    }
  }
}

export function stopSpeaking() {
  stopSpeakingOpenAI();
}

// Speech-to-Text (STT)
let recognition: any | null = null;
let isRecognizing = false;

export function startRecognition(
  onResult: (transcript: string) => void,
  onEnd?: () => void,
  onError?: (error: string) => void
) {
  if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    alert('Sorry, your browser does not support speech recognition.');
    return;
  }
  const SpeechRecognitionImpl =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  recognition = new SpeechRecognitionImpl();
  recognition.lang = 'fr-FR'; // Français
  recognition.continuous = true; // Continue d'écouter
  recognition.interimResults = true; // Résultats intermédiaires en temps réel
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: any) => {
    let finalTranscript = '';
    
    // Parcourir tous les résultats
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
      }
    }
    
    // Envoyer uniquement les transcripts finaux
    if (finalTranscript.trim()) {
      onResult(finalTranscript.trim());
    }
  };
  recognition.onerror = (event: any) => {
    if (onError) onError(event.error);
  };
  recognition.onend = () => {
    isRecognizing = false;
    if (onEnd) onEnd();
  };
  isRecognizing = true;
  recognition.start();
}

export function stopRecognition() {
  if (recognition && isRecognizing) {
    recognition.stop();
    isRecognizing = false;
  }
}

