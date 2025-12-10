import { useState, useCallback } from 'react';

export interface VoiceInputState {
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string;
  error: string | null;
}

export interface VoiceInputOptions {
  onTranscript?: (text: string) => void;
  onError?: (error: string) => void;
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
  
  const toggleRecording = useCallback(() => {
    setState(prev => ({
      ...prev,
      isRecording: !prev.isRecording
    }));
  }, []);

  return {
    ...state,
    toggleRecording
  };
}
