import { useState, useCallback, useRef, useEffect } from 'react';
import { OpenAIRealtimeService, RealtimeTool } from '../services/openai-realtime.service';

export interface DocumentTools {
  getCurrentContent: () => string;
  updateContent: (newContent: string) => void;
}

export interface UseRealtimeVoiceSimpleReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  transcript: Array<{ text: string; role: 'user' | 'assistant'; timestamp: Date }>;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendText: (text: string) => void;
}

export function useRealtimeVoiceSimple(
  apiKey: string,
  documentTools: DocumentTools
): UseRealtimeVoiceSimpleReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<Array<{ text: string; role: 'user' | 'assistant'; timestamp: Date }>>([]);
  
  const serviceRef = useRef<OpenAIRealtimeService | null>(null);

  // Créer les outils pour modifier les documents
  const createTools = useCallback((): RealtimeTool[] => {
    return [
      {
        name: 'update_document_content',
        description: 'Remplace tout le contenu du document actuel par un nouveau contenu',
        parameters: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'Le nouveau contenu complet du document'
            }
          },
          required: ['content']
        }
      },
      {
        name: 'insert_text',
        description: 'Insère du texte à la fin du document actuel',
        parameters: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'Le texte à insérer'
            }
          },
          required: ['text']
        }
      },
      {
        name: 'replace_text',
        description: 'Remplace une partie du texte dans le document',
        parameters: {
          type: 'object',
          properties: {
            search: {
              type: 'string',
              description: 'Le texte à rechercher et remplacer'
            },
            replace: {
              type: 'string',
              description: 'Le nouveau texte de remplacement'
            }
          },
          required: ['search', 'replace']
        }
      },
      {
        name: 'get_document_content',
        description: 'Récupère le contenu actuel du document pour le lire ou l\'analyser',
        parameters: {
          type: 'object',
          properties: {}
        }
      }
    ];
  }, []);

  // Gestionnaire d'appels de fonction
  const handleToolCall = useCallback(async (toolName: string, args: any) => {
    console.log(`[useRealtimeVoice] Exécution de l'outil: ${toolName}`, args);
    
    try {
      switch (toolName) {
        case 'update_document_content':
          documentTools.updateContent(args.content);
          return { success: true, message: 'Document mis à jour avec succès' };
        
        case 'insert_text':
          const currentContent = documentTools.getCurrentContent();
          documentTools.updateContent(currentContent + '\n\n' + args.text);
          return { success: true, message: 'Texte inséré avec succès' };
        
        case 'replace_text':
          const content = documentTools.getCurrentContent();
          const newContent = content.replace(args.search, args.replace);
          
          if (newContent === content) {
            return { success: false, message: 'Texte non trouvé dans le document' };
          }
          
          documentTools.updateContent(newContent);
          return { success: true, message: 'Texte remplacé avec succès' };
        
        case 'get_document_content':
          const docContent = documentTools.getCurrentContent();
          return { 
            success: true, 
            content: docContent,
            length: docContent.length,
            message: 'Contenu récupéré avec succès'
          };
        
        default:
          return { success: false, message: `Outil inconnu: ${toolName}` };
      }
    } catch (error: any) {
      console.error(`[useRealtimeVoice] Erreur lors de l'exécution de ${toolName}:`, error);
      return { success: false, error: error.message };
    }
  }, [documentTools]);

  const connect = useCallback(async () => {
    if (isConnecting || isConnected) {
      return;
    }

    if (!apiKey) {
      setError('Clé API OpenAI manquante');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const tools = createTools();
      
      serviceRef.current = new OpenAIRealtimeService({
        apiKey,
        voice: 'coral',
        tools,
        onToolCall: handleToolCall
      });

      // Écouter les transcriptions
      serviceRef.current.on('conversation.item.input_audio_transcription.completed', (data: any) => {
        if (data.transcript) {
          setTranscript(prev => [...prev, { 
            text: data.transcript, 
            role: 'user', 
            timestamp: new Date() 
          }]);
        }
      });

      serviceRef.current.on('response.audio_transcript.done', (data: any) => {
        if (data.transcript) {
          setTranscript(prev => [...prev, { 
            text: data.transcript, 
            role: 'assistant', 
            timestamp: new Date() 
          }]);
        }
      });

      // Écouter les chunks audio pour les jouer
      serviceRef.current.on('response.audio.delta', (data: any) => {
        if (data.delta && serviceRef.current) {
          serviceRef.current.playAudio(data.delta);
        }
      });

      await serviceRef.current.connect();
      await serviceRef.current.startAudioCapture();
      
      setIsConnected(true);
      console.log('[useRealtimeVoice] Connecté avec succès');
    } catch (err: any) {
      console.error('[useRealtimeVoice] Erreur de connexion:', err);
      setError(err.message || 'Erreur de connexion');
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, isConnected, apiKey, createTools, handleToolCall]);

  const disconnect = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.disconnect();
      serviceRef.current = null;
      setIsConnected(false);
      console.log('[useRealtimeVoice] Déconnecté');
    }
  }, []);

  const sendText = useCallback((text: string) => {
    if (serviceRef.current && isConnected) {
      serviceRef.current.sendText(text);
    }
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
