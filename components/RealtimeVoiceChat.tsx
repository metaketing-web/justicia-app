import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { RealtimeVoiceService, RealtimeVoiceConfig, RealtimeVoiceCallbacks } from '../services/realtimeVoice.service';

interface RealtimeVoiceChatProps {
    onClose: () => void;
    context?: string; // Contexte de la conversation (document en cours, etc.)
    instructions?: string; // Instructions personnalisées pour l'IA
    onSaveConversation?: (messages: Array<{ role: 'user' | 'assistant', content: string }>) => void;
}

const RealtimeVoiceChat: React.FC<RealtimeVoiceChatProps> = ({ onClose, context, instructions, onSaveConversation }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [userTranscript, setUserTranscript] = useState('');
    const [aiTranscript, setAiTranscript] = useState('');
    const [conversationHistory, setConversationHistory] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
    const [error, setError] = useState<string | null>(null);
    const [audioLevel, setAudioLevel] = useState(0);
    
    const serviceRef = useRef<RealtimeVoiceService | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioQueueRef = useRef<ArrayBuffer[]>([]);
    const isPlayingRef = useRef(false);
    const animationFrameRef = useRef<number | null>(null);

    /**
     * Initialiser le service vocal
     */
    useEffect(() => {
        const initVoiceService = async () => {
            try {
                const apiKey = import.meta.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY || '';
                
                if (!apiKey) {
                    setError('Clé API OpenAI manquante');
                    return;
                }

                const config: RealtimeVoiceConfig = {
                    apiKey,
                    model: 'gpt-realtime',
                    voice: 'cedar',
                    instructions: instructions || `Vous êtes JUSTICIA, un assistant juridique expert en droit ivoirien.

${context ? `CONTEXTE ACTUEL:
${context}

` : ''}DIRECTIVES:
- Fournissez des analyses juridiques APPROFONDIES et DÉTAILLÉES
- Citez SYSTÉMATIQUEMENT les sources légales (articles, codes, lois)
- Expliquez le RAISONNEMENT juridique, pas seulement les conclusions
- Structurez vos réponses : Synthèse → Analyse détaillée → Recommandations
- Utilisez un langage professionnel mais accessible
- Anticipez les questions de suivi et y répondez proactivement
- Pour les sujets complexes, décomposez en étapes logiques
- Mentionnez les risques, exceptions et cas particuliers pertinents
- Si vous avez besoin d'informations en temps réel ou de recherches web, suggérez à l'utilisateur de passer au chat texte pour activer la recherche web automatique
- Indiquez clairement quand vos réponses sont basées sur vos connaissances générales vs des sources spécifiques`,
                    temperature: 0.8,
                    maxTokens: 4096
                };

                const callbacks: RealtimeVoiceCallbacks = {
                    onConnected: () => {
                        console.log('[VoiceChat] Connecté');
                        setIsConnected(true);
                        setError(null);
                    },
                    onDisconnected: () => {
                        console.log('[VoiceChat] Déconnecté');
                        setIsConnected(false);
                        setIsListening(false);
                        setIsSpeaking(false);
                    },
                    onError: (err) => {
                        console.error('[VoiceChat] Erreur:', err);
                        setError(err.message);
                    },
                    onTranscriptUpdate: (text, isFinal) => {
                        if (isFinal) {
                            setUserTranscript(text);
                            setIsListening(false);
                            // Ajouter à l'historique
                            setConversationHistory(prev => [...prev, { role: 'user', content: text }]);
                        }
                    },
                    onAudioResponse: (audioData) => {
                        // Ajouter l'audio à la queue de lecture
                        audioQueueRef.current.push(audioData);
                        setIsSpeaking(true);
                        
                        // Démarrer la lecture si pas déjà en cours
                        if (!isPlayingRef.current) {
                            playAudioQueue();
                        }
                    },
                    onResponseComplete: (transcript) => {
                        setAiTranscript(transcript);
                        console.log('[VoiceChat] Réponse IA:', transcript);
                        // Ajouter à l'historique
                        setConversationHistory(prev => [...prev, { role: 'assistant', content: transcript }]);
                        
                        // Appeler le callback de transcription si disponible (pour l'éditeur)
                        const callback = (window as any).__voiceChatTranscriptCallback;
                        if (callback && typeof callback === 'function') {
                            callback(transcript);
                        }
                    },
                    onInterrupted: () => {
                        console.log('[VoiceChat] Interruption');
                        stopAudioPlayback();
                    }
                };

                const service = new RealtimeVoiceService(config, callbacks);
                serviceRef.current = service;

                // Connecter au WebSocket
                await service.connect();

                // Démarrer la capture audio
                await service.startAudioCapture();
                setIsListening(true);

                // Initialiser le contexte audio pour la lecture
                audioContextRef.current = new AudioContext({ sampleRate: 24000 });

            } catch (err) {
                console.error('[VoiceChat] Erreur d\'initialisation:', err);
                setError('Impossible de démarrer le mode vocal');
            }
        };

        initVoiceService();

        // Nettoyage
        return () => {
            if (serviceRef.current) {
                serviceRef.current.disconnect();
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [context, instructions]);

    /**
     * Lire la queue audio
     */
    const playAudioQueue = useCallback(async () => {
        if (!audioContextRef.current || isPlayingRef.current) return;

        isPlayingRef.current = true;

        while (audioQueueRef.current.length > 0) {
            const audioData = audioQueueRef.current.shift();
            if (!audioData) continue;

            try {
                // Convertir PCM16 en AudioBuffer
                const pcm16 = new Int16Array(audioData);
                const float32 = new Float32Array(pcm16.length);
                
                for (let i = 0; i < pcm16.length; i++) {
                    float32[i] = pcm16[i] / (pcm16[i] < 0 ? 0x8000 : 0x7FFF);
                }

                const audioBuffer = audioContextRef.current.createBuffer(1, float32.length, 24000);
                audioBuffer.getChannelData(0).set(float32);

                // Jouer l'audio
                const source = audioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContextRef.current.destination);

                await new Promise<void>((resolve) => {
                    source.onended = () => resolve();
                    source.start();
                });

            } catch (err) {
                console.error('[VoiceChat] Erreur de lecture audio:', err);
            }
        }

        isPlayingRef.current = false;
        setIsSpeaking(false);
    }, []);

    /**
     * Arrêter la lecture audio
     */
    const stopAudioPlayback = useCallback(() => {
        audioQueueRef.current = [];
        isPlayingRef.current = false;
        setIsSpeaking(false);
        
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        }
    }, []);

    /**
     * Basculer le mode muet
     */
    const toggleMute = useCallback(() => {
        setIsMuted(prev => !prev);
        
        if (!isMuted && serviceRef.current) {
            serviceRef.current.stopAudioCapture();
        } else if (isMuted && serviceRef.current) {
            serviceRef.current.startAudioCapture();
        }
    }, [isMuted]);

    /**
     * Interrompre l'IA
     */
    const handleInterrupt = useCallback(() => {
        if (serviceRef.current && isSpeaking) {
            serviceRef.current.interrupt();
            stopAudioPlayback();
        }
    }, [isSpeaking, stopAudioPlayback]);

    /**
     * Fermer le mode vocal
     */
    const handleClose = useCallback(() => {
        if (serviceRef.current) {
            serviceRef.current.disconnect();
        }
        
        // Sauvegarder la conversation si elle n'est pas vide
        if (conversationHistory.length > 0 && onSaveConversation) {
            onSaveConversation(conversationHistory);
        }
        
        onClose();
    }, [onClose, conversationHistory, onSaveConversation]);

    /**
     * Animation des ondes sonores
     */
    useEffect(() => {
        if (!isListening && !isSpeaking) return;

        const animate = () => {
            // Simuler un niveau audio (en production, utiliser analyser node)
            const level = Math.random() * 0.5 + 0.3;
            setAudioLevel(level);
            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isListening, isSpeaking]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-2xl mx-4">
                {/* Bouton fermer */}
                <button
                    onClick={handleClose}
                    className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Contenu principal */}
                <div className="text-center space-y-8">
                    {/* Animation vocale centrale */}
                    <div className="relative flex items-center justify-center h-64">
                        {/* Cercles d'animation */}
                        {[...Array(3)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute rounded-full border-2 border-justicia-gradient"
                                style={{
                                    width: `${120 + i * 60}px`,
                                    height: `${120 + i * 60}px`,
                                    opacity: isListening || isSpeaking ? 0.3 - i * 0.1 : 0,
                                    transform: `scale(${1 + audioLevel * (i + 1) * 0.2})`,
                                    transition: 'all 0.3s ease-out'
                                }}
                            />
                        ))}

                        {/* Icône centrale */}
                        <div className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center ${
                            isSpeaking ? 'bg-blue-500/20' : isListening ? 'bg-green-500/20' : 'bg-gray-500/20'
                        } transition-colors duration-300`}>
                            {isSpeaking ? (
                                <Volume2 className="w-16 h-16 text-blue-400 animate-pulse" />
                            ) : isListening ? (
                                <Mic className="w-16 h-16 text-green-400 animate-pulse" />
                            ) : (
                                <MicOff className="w-16 h-16 text-gray-400" />
                            )}
                        </div>
                    </div>

                    {/* État de la connexion */}
                    <div className="space-y-2">
                        {error ? (
                            <p className="text-red-400 text-lg font-medium">❌ {error}</p>
                        ) : !isConnected ? (
                            <p className="text-gray-400 text-lg">Connexion en cours...</p>
                        ) : isSpeaking ? (
                            <p className="text-blue-400 text-lg font-medium flex items-center justify-center gap-2">
                                <img src="/justicia_loader_perfect.gif" alt="Justicia" className="w-6 h-6" />
                                Justicia
                            </p>
                        ) : isListening ? (
                            <p className="text-green-400 text-lg font-medium">🎤 À l'écoute...</p>
                        ) : (
                            <p className="text-gray-400 text-lg">En attente...</p>
                        )}
                    </div>

                    {/* Transcriptions */}
                    <div className="space-y-4 max-h-48 overflow-y-auto">
                        {userTranscript && (
                            <div className="bg-white/5 rounded-xl p-4 text-left">
                                <p className="text-xs text-gray-400 mb-1">Vous</p>
                                <p className="text-white">{userTranscript}</p>
                            </div>
                        )}
                        {aiTranscript && (
                            <div className="bg-blue-500/10 rounded-xl p-4 text-left">
                                <p className="text-xs text-blue-400 mb-1">Justicia</p>
                                <p className="text-white">{aiTranscript}</p>
                            </div>
                        )}
                    </div>

                    {/* Contrôles */}
                    <div className="flex items-center justify-center gap-4">
                        {/* Bouton muet */}
                        <button
                            onClick={toggleMute}
                            disabled={!isConnected}
                            className={`p-4 rounded-full transition-all ${
                                isMuted
                                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                        </button>

                        {/* Bouton interrompre */}
                        {isSpeaking && (
                            <button
                                onClick={handleInterrupt}
                                className="px-6 py-3 bg-orange-500/20 text-orange-400 rounded-full hover:bg-orange-500/30 transition-colors font-medium"
                            >
                                ✋ Interrompre
                            </button>
                        )}
                    </div>

                    {/* Instructions */}
                    <p className="text-gray-500 text-sm">
                        {isConnected 
                            ? "Parlez naturellement. L'IA vous répondra automatiquement."
                            : "Connexion au service vocal..."}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RealtimeVoiceChat;
