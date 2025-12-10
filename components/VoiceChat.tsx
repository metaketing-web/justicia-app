import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff, StopCircle } from 'lucide-react';
import { OpenAIRealtimeService } from '../services/openai-realtime.service';

interface VoiceChatProps {
  onClose: () => void;
  context?: string;
  user?: { name?: string; username?: string; avatarUrl?: string };
  onSaveConversation?: (messages: { role: 'user' | 'assistant'; content: string }[]) => void;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

const VoiceChat: React.FC<VoiceChatProps> = ({ onClose, context, user, onSaveConversation }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentUserMessage, setCurrentUserMessage] = useState('');
  const [currentAIMessage, setCurrentAIMessage] = useState('');
  
  const realtimeServiceRef = useRef<OpenAIRealtimeService | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialiser le service Realtime
  useEffect(() => {
    const initService = async () => {
      try {
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
        
        // Enrichir le contexte avec la base de connaissances RAG
        let enrichedContext = context || '';
        try {
          const { getRAGStats } = await import('../services/ragService.enhanced');
          const stats = await getRAGStats();
          
          if (stats.documentCount > 0) {
            enrichedContext += `\n\n=== BASE DE CONNAISSANCES ===\nVous avez accès à ${stats.documentCount} document(s) dans la base de connaissances avec ${stats.totalChunks} sections indexées.\nLorsque l'utilisateur pose une question, vous pouvez faire référence à tous les documents de la base.`;
            console.log('[VoiceChat] Base de connaissances ajoutée au contexte:', stats);
          }
        } catch (ragError) {
          console.warn('[VoiceChat] Impossible de charger les stats RAG:', ragError);
        }
        
        const instructions = enrichedContext 
          ? `Vous êtes JUSTICIA, un assistant juridique expert spécialisé dans l'analyse de documents juridiques.

=== CONTEXTE DU DOCUMENT ===
${enrichedContext}

=== VOS CAPACITÉS ===
Vous avez accès à l'intégralité du document et de son analyse. Vous pouvez:
- Répondre à des questions précises sur le contenu du document
- Expliquer les signalements détectés et leur gravité
- Détailler les risques identifiés et leurs implications
- Clarifier les clauses complexes en langage simple
- Proposer des reformulations pour les clauses problématiques
- Donner des recommandations juridiques basées sur l'analyse
- Comparer différentes sections du document
- Répondre sur les statistiques et la structure du document
- Rechercher sur internet des informations juridiques complémentaires si nécessaire
- Consulter la base de connaissances RAG pour des références légales

=== INSTRUCTIONS ===
1. Répondez en français de manière claire et professionnelle
2. Citez toujours les clauses spécifiques quand vous référencez le document
3. Soyez précis et factuel, basé sur l'analyse fournie
4. Si l'utilisateur pose une question sur un élément non présent dans le contexte, indiquez-le clairement
5. Utilisez un ton accessible tout en restant expert
6. Précisez le niveau de sévérité quand vous parlez des risques
7. Soyez concis dans vos réponses vocales (2-3 phrases maximum)

Aidez l'utilisateur à comprendre et analyser ce document juridique de manière approfondie.`
          : 'Vous êtes JUSTICIA, un assistant juridique expert qui aide à analyser des documents juridiques. Répondez en français de manière claire, professionnelle et concise (2-3 phrases maximum).';
        
        const service = new OpenAIRealtimeService({
          apiKey,
          voice: 'cedar',
          instructions
        });

        // Gérer les événements
        service.on('response.audio.delta', (data) => {
          if (data.delta) {
            service.playAudio(data.delta);
            setIsSpeaking(true);
          }
        });

        service.on('response.audio.done', () => {
          setIsSpeaking(false);
        });

        // Transcription de l'utilisateur
        service.on('conversation.item.input_audio_transcription.completed', (data) => {
          if (data.transcript) {
            setCurrentUserMessage(data.transcript);
          }
        });

        // Quand l'utilisateur finit de parler, sauvegarder son message
        service.on('input_audio_buffer.speech_stopped', () => {
          if (currentUserMessage) {
            setMessages(prev => [...prev, {
              role: 'user',
              content: currentUserMessage,
              timestamp: Date.now()
            }]);
            setCurrentUserMessage('');
          }
        });

        // Réponse de l'IA (texte)
        service.on('response.text.delta', (data) => {
          if (data.delta) {
            setCurrentAIMessage(prev => prev + data.delta);
          }
        });

        service.on('response.text.done', () => {
          if (currentAIMessage) {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: currentAIMessage,
              timestamp: Date.now()
            }]);
            setCurrentAIMessage('');
          }
        });

        service.on('response.done', () => {
          setIsSpeaking(false);
          // Sauvegarder le message AI si pas encore fait
          if (currentAIMessage) {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: currentAIMessage,
              timestamp: Date.now()
            }]);
            setCurrentAIMessage('');
          }
        });

        service.on('error', (data) => {
          console.error('Erreur Realtime:', data);
          setError(data.error?.message || 'Une erreur est survenue');
        });

        await service.connect();
        realtimeServiceRef.current = service;
        setIsConnected(true);
        setMessages([{
          role: 'system',
          content: '✅ Connecté à l\'assistant vocal',
          timestamp: Date.now()
        }]);
        
      } catch (err) {
        console.error('Erreur d\'initialisation:', err);
        setError('Impossible de se connecter au service vocal');
      }
    };

    initService();

    return () => {
      if (realtimeServiceRef.current) {
        realtimeServiceRef.current.disconnect();
      }
    };
  }, [context]);

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentUserMessage, currentAIMessage]);

  // Démarrer/arrêter l'enregistrement
  const toggleRecording = async () => {
    if (!realtimeServiceRef.current) return;

    try {
      if (isRecording) {
        realtimeServiceRef.current.stopAudioCapture();
        setIsRecording(false);
        setMessages(prev => [...prev, {
          role: 'system',
          content: '🎤 Microphone désactivé',
          timestamp: Date.now()
        }]);
      } else {
        await realtimeServiceRef.current.startAudioCapture();
        setIsRecording(true);
        setMessages(prev => [...prev, {
          role: 'system',
          content: '🎤 Microphone activé - Parlez maintenant',
          timestamp: Date.now()
        }]);
      }
    } catch (err) {
      console.error('Erreur microphone:', err);
      setError('Impossible d\'accéder au microphone');
    }
  };

  // Interrompre l'IA
  const interruptAI = () => {
    if (!realtimeServiceRef.current) return;
    
    // Arrêter l'audio en cours
    realtimeServiceRef.current.disconnect();
    setIsSpeaking(false);
    
    // Sauvegarder le message partiel de l'IA
    if (currentAIMessage) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: currentAIMessage + ' [interrompu]',
        timestamp: Date.now()
      }]);
      setCurrentAIMessage('');
    }
    
    setMessages(prev => [...prev, {
      role: 'system',
      content: '⏸️ IA interrompue',
      timestamp: Date.now()
    }]);
  };

  // Raccrocher et sauvegarder
  const hangUp = () => {
    // Sauvegarder la conversation dans le chat principal
    if (onSaveConversation && messages.length > 0) {
      const chatMessages = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        }));
      
      if (chatMessages.length > 0) {
        onSaveConversation(chatMessages);
      }
    }
    
    if (realtimeServiceRef.current) {
      realtimeServiceRef.current.disconnect();
    }
    onClose();
  };

  const userName = user?.name || user?.username || 'Vous';
  const userAvatar = user?.avatarUrl || '/justicia-avatar.png';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999]">
      <div className="bg-neutral-900 rounded-xl shadow-2xl w-[600px] h-[700px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-700">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
            <h2 className="text-xl font-bold text-white">
              {isConnected ? 'Conversation Vocale Active' : 'Connexion...'}
            </h2>
          </div>
          <button
            onClick={hangUp}
            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <PhoneOff size={24} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${
                message.role === 'user' ? 'flex-row' : message.role === 'assistant' ? 'flex-row-reverse' : 'justify-center'
              }`}
            >
              {message.role === 'user' && (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-8 h-8 rounded-full"
                />
              )}
              {message.role === 'assistant' && (
                <img
                  src="/justicia-logo.png"
                  alt="Justicia"
                  className="w-8 h-8 rounded-full"
                />
              )}
              <div
                className={`p-3 rounded-lg max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-blue-900/30 text-blue-200'
                    : message.role === 'assistant'
                    ? 'bg-purple-900/30 text-purple-200'
                    : 'bg-neutral-800 text-gray-300 text-center text-sm'
                }`}
              >
                {message.role === 'user' && <div className="text-xs text-blue-400 mb-1">{userName}</div>}
                {message.role === 'assistant' && <div className="text-xs text-purple-400 mb-1">Justicia</div>}
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
            </div>
          ))}
          
          {/* Message en cours de l'utilisateur */}
          {currentUserMessage && (
            <div className="flex items-start gap-3">
              <img src={userAvatar} alt={userName} className="w-8 h-8 rounded-full" />
              <div className="p-3 rounded-lg max-w-[80%] bg-blue-900/30 text-blue-200">
                <div className="text-xs text-blue-400 mb-1">{userName}</div>
                <div className="whitespace-pre-wrap">{currentUserMessage}</div>
              </div>
            </div>
          )}
          
          {/* Message en cours de l'IA */}
          {currentAIMessage && (
            <div className="flex items-start gap-3 flex-row-reverse">
              <img src="/justicia-logo.png" alt="Justicia" className="w-8 h-8 rounded-full" />
              <div className="p-3 rounded-lg max-w-[80%] bg-purple-900/30 text-purple-200">
                <div className="text-xs text-purple-400 mb-1">Justicia</div>
                <div className="whitespace-pre-wrap">{currentAIMessage}</div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mb-4 p-3 bg-red-900/30 border border-red-500 rounded-lg text-red-200 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Controls */}
        <div className="p-6 border-t border-neutral-700">
          <div className="flex items-center justify-center gap-6">
            {/* Microphone */}
            <button
              onClick={toggleRecording}
              disabled={!isConnected}
              className={`p-6 rounded-full transition-all shadow-lg ${
                isRecording
                  ? 'bg-blue-500 hover:bg-blue-600 animate-pulse shadow-blue-500/50'
                  : 'bg-gray-600 hover:bg-gray-500'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={isRecording ? 'Désactiver le micro' : 'Activer le micro'}
            >
              {isRecording ? <Mic size={32} className="text-white" /> : <MicOff size={32} className="text-gray-300" />}
            </button>

            {/* Interrupt AI */}
            {isSpeaking && (
              <button
                onClick={interruptAI}
                className="p-6 rounded-full bg-orange-500 hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/50 animate-pulse"
                title="Interrompre l'IA"
              >
                <StopCircle size={32} className="text-white" />
              </button>
            )}

            {/* Speaker indicator */}
            <div className={`p-6 rounded-full ${isSpeaking ? 'bg-purple-500 animate-pulse shadow-lg shadow-purple-500/50' : 'bg-gray-600'}`}>
              {isSpeaking ? <Volume2 size={32} className="text-white" /> : <VolumeX size={32} className="text-gray-400" />}
            </div>

            {/* Hang up */}
            <button
              onClick={hangUp}
              className="p-6 rounded-full bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/50"
              title="Raccrocher et sauvegarder"
            >
              <Phone size={32} className="text-white transform rotate-135" />
            </button>
          </div>

          <div className="mt-4 text-center text-sm text-gray-400">
            {isRecording ? (
              <span className="text-blue-400">● En écoute - Parlez maintenant</span>
            ) : isSpeaking ? (
              <span className="text-purple-400">🔊 L'IA parle... (cliquez sur ⏹️ pour interrompre)</span>
            ) : (
              <span>Cliquez sur le microphone pour parler</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceChat;
