import { useState, useCallback, useRef, useEffect } from 'react';

export interface VoiceInputState {
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string;
  error: string | null;
}

export interface VoiceInputOptions {
  onTranscript?: (text: string) => void;
  onError?: (error: string) => void;
  language?: string;
  continuous?: boolean;
}

export function useVoiceInput(options?: VoiceInputOptions | ((text: string) => void)) {
  const [state, setState] = useState<VoiceInputState>({
    isRecording: false,
    isProcessing: false,
    transcript: '',
    error: null
  });

  // Normaliser les options
  const opts = typeof options === 'function' ? { onTranscript: options } : options || {};
  const { onTranscript, onError, language = 'fr-FR', continuous = false } = opts;

  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');

  // Initialiser Web Speech API
  useEffect(() => {
    // Vérifier si l'API est disponible
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('Web Speech API non supportée par ce navigateur');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('[Voice Input] Reconnaissance vocale démarrée');
      finalTranscriptRef.current = '';
      setState(prev => ({ ...prev, isRecording: true, error: null }));
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        finalTranscriptRef.current += finalTranscript;
        const text = finalTranscriptRef.current.trim();
        console.log('[Voice Input] Transcription finale:', text);
        
        setState(prev => ({ ...prev, transcript: text }));
        
        if (onTranscript) {
          onTranscript(text);
        }
      } else {
        setState(prev => ({ ...prev, transcript: interimTranscript }));
      }
    };

    recognition.onerror = (event: any) => {
      console.error('[Voice Input] Erreur:', event.error);
      let errorMessage = 'Erreur de reconnaissance vocale';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'Aucune parole détectée. Réessayez.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone non accessible';
          break;
        case 'not-allowed':
          errorMessage = 'Permission microphone refusée';
          break;
        case 'network':
          errorMessage = 'Erreur réseau';
          break;
        default:
          errorMessage = `Erreur: ${event.error}`;
      }

      setState(prev => ({ ...prev, error: errorMessage, isRecording: false }));
      
      if (onError) {
        onError(errorMessage);
      }
    };

    recognition.onend = () => {
      console.log('[Voice Input] Reconnaissance vocale terminée');
      setState(prev => ({ ...prev, isRecording: false }));
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [language, continuous, onTranscript, onError]);

  const toggleRecording = useCallback(() => {
    if (!recognitionRef.current) {
      const errorMsg = 'Reconnaissance vocale non disponible dans ce navigateur';
      setState(prev => ({ ...prev, error: errorMsg }));
      if (onError) {
        onError(errorMsg);
      }
      return;
    }

    if (state.isRecording) {
      console.log('[Voice Input] Arrêt de la reconnaissance');
      recognitionRef.current.stop();
    } else {
      console.log('[Voice Input] Démarrage de la reconnaissance');
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('[Voice Input] Erreur au démarrage:', error);
        const errorMsg = 'Impossible de démarrer la reconnaissance vocale';
        setState(prev => ({ ...prev, error: errorMsg }));
        if (onError) {
          onError(errorMsg);
        }
      }
    }
  }, [state.isRecording, onError]);

  return {
    ...state,
    toggleRecording
  };
}
