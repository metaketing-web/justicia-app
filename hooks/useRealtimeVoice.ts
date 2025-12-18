import { useState, useCallback, useRef, useEffect } from 'react';
import { RealtimeVoiceAdvancedService, createDocumentTools, DocumentModificationTool } from '../services/realtimeVoiceAdvanced.service';

export interface UseRealtimeVoiceOptions {
  apiKey: string;
  getCurrentContent: () => string;
  updateContent: (newContent: string) => void;
  onTranscript?: (text: string, role: 'user' | 'assistant') => void;
  onDocumentModified?: (modification: any) => void;
  additionalTools?: DocumentModificationTool[];
}

export interface UseRealtimeVoiceReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  transcript: Array<{ text: string; role: 'user' | 'assistant'; timestamp: Date }>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendText: (text: string) => Promise<void>;
}

export function useRealtimeVoice(options: UseRealtimeVoiceOptions): UseRealtimeVoiceReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<Array<{ text: string; role: 'user' | 'assistant'; timestamp: Date }>>([]);
  
  const serviceRef = useRef<RealtimeVoiceAdvancedService | null>(null);

  const connect = useCallback(async () => {
    if (isConnecting || isConnected) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Créer les outils de modification de documents
      const documentTools = createDocumentTools(
        options.getCurrentContent,
        options.updateContent
      );

      // Ajouter les outils additionnels si fournis
      const allTools = options.additionalTools 
        ? [...documentTools, ...options.additionalTools]
        : documentTools;

      // Créer le service
      serviceRef.current = new RealtimeVoiceAdvancedService({
        apiKey: options.apiKey,
        voice: 'coral',
        tools: allTools,
        onTranscript: (text, role) => {
          setTranscript(prev => [...prev, { text, role, timestamp: new Date() }]);
          if (options.onTranscript) {
            options.onTranscript(text, role);
          }
        },
        onDocumentModified: options.onDocumentModified
      });

      // Connecter
      await serviceRef.current.connect();
      setIsConnected(true);
      console.log('[useRealtimeVoice] Connecté avec succès');
    } catch (err: any) {
      console.error('[useRealtimeVoice] Erreur de connexion:', err);
      setError(err.message || 'Erreur de connexion');
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, isConnected, options]);

  const disconnect = useCallback(async () => {
    if (serviceRef.current) {
      await serviceRef.current.disconnect();
      serviceRef.current = null;
      setIsConnected(false);
      console.log('[useRealtimeVoice] Déconnecté');
    }
  }, []);

  const sendText = useCallback(async (text: string) => {
    if (!serviceRef.current || !isConnected) {
      throw new Error('Service non connecté');
    }

    await serviceRef.current.sendText(text);
  }, [isConnected]);

  // Nettoyer à la destruction du composant
  useEffect(() => {
    return () => {
      if (serviceRef.current) {
        serviceRef.current.disconnect();
      }
    };
  }, []);

  return {
    isConnected,
    isConnecting,
    error,
    transcript,
    connect,
    disconnect,
    sendText
  };
}
