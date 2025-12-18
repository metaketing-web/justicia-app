import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Loader2, FileText, AlertCircle } from 'lucide-react';
import { OpenAIRealtimeService, RealtimeTool } from '../services/openai-realtime.service';
import { trpc } from '../lib/trpc';

interface RealtimeVoiceChatProps {
    onClose: () => void;
    context?: string;
    instructions?: string;
    onSaveConversation?: (messages: Array<{ role: 'user' | 'assistant', content: string }>) => void;
    onCreateDocument?: (title: string, content: string, type?: string) => Promise<any>;
    onCreateFromTemplate?: (templateName: string, variables: Record<string, any>) => Promise<any>;
    getCurrentDocument?: () => { content: string; title: string } | null;
    onUpdateDocument?: (content: string) => void;
}

const RealtimeVoiceChat: React.FC<RealtimeVoiceChatProps> = ({ 
    onClose, 
    context, 
    instructions, 
    onSaveConversation,
    onCreateDocument,
    onCreateFromTemplate,
    getCurrentDocument,
    onUpdateDocument
}) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [transcript, setTranscript] = useState<Array<{ role: 'user' | 'assistant', text: string, timestamp: Date }>>([]);
    const [toolCalls, setToolCalls] = useState<Array<{ tool: string, args: any, result: any, timestamp: Date }>>([]);
    
    const serviceRef = useRef<OpenAIRealtimeService | null>(null);

    // Gestionnaire d'appels d'outils
    const handleToolCall = async (toolName: string, args: any) => {
        console.log(`[RealtimeVoiceChat] Appel d'outil: ${toolName}`, args);
        
        const timestamp = new Date();
        
        try {
            let result: any;
            
            switch (toolName) {
                case 'create_blank_document':
                    try {
                        // Créer via tRPC (DB + S3 + RAG)
                        const document = await trpc.documents.createWithContent.mutate({
                            title: args.title,
                            content: args.content,
                            type: args.type || 'created',
                            metadata: {
                                source: 'realtime_voice',
                                createdVia: 'voice_command'
                            }
                        });
                        
                        setToolCalls(prev => [...prev, { 
                            tool: 'create_blank_document', 
                            args, 
                            result: { success: true, document },
                            timestamp 
                        }]);
                        
                        // Appeler le callback si fourni
                        if (onCreateDocument) {
                            await onCreateDocument(args.title, args.content, args.type);
                        }
                        
                        return { 
                            success: true, 
                            message: `Document "${args.title}" créé avec succès`,
                            documentId: document.id 
                        };
                    } catch (error: any) {
                        return { success: false, message: `Erreur: ${error.message}` };
                    }
                
                case 'create_document_from_template':
                    if (onCreateFromTemplate) {
                        result = await onCreateFromTemplate(args.templateName, args.variables);
                        setToolCalls(prev => [...prev, { 
                            tool: 'create_document_from_template', 
                            args, 
                            result: { success: true, document: result },
                            timestamp 
                        }]);
                        return { 
                            success: true, 
                            message: `Document créé à partir du modèle "${args.templateName}"`,
                            documentId: result?.id 
                        };
                    }
                    return { success: false, message: 'Fonction de création depuis modèle non disponible' };
                
                case 'update_current_document':
                    if (onUpdateDocument) {
                        onUpdateDocument(args.content);
                        setToolCalls(prev => [...prev, { 
                            tool: 'update_current_document', 
                            args, 
                            result: { success: true },
                            timestamp 
                        }]);
                        return { success: true, message: 'Document mis à jour avec succès' };
                    }
                    return { success: false, message: 'Fonction de mise à jour non disponible' };
                
                case 'get_current_document':
                    if (getCurrentDocument) {
                        const doc = getCurrentDocument();
                        if (doc) {
                            setToolCalls(prev => [...prev, { 
                                tool: 'get_current_document', 
                                args, 
                                result: { success: true, document: doc },
                                timestamp 
                            }]);
                            return { 
                                success: true, 
                                title: doc.title,
                                content: doc.content,
                                length: doc.content.length 
                            };
                        }
                        return { success: false, message: 'Aucun document ouvert' };
                    }
                    return { success: false, message: 'Fonction de récupération non disponible' };
                
                default:
                    return { success: false, message: `Outil inconnu: ${toolName}` };
            }
        } catch (error: any) {
            console.error(`[RealtimeVoiceChat] Erreur lors de l'exécution de ${toolName}:`, error);
            setToolCalls(prev => [...prev, { 
                tool: toolName, 
                args, 
                result: { success: false, error: error.message },
                timestamp 
            }]);
            return { success: false, error: error.message };
        }
    };

    // Initialiser le service
    useEffect(() => {
        const initService = async () => {
            setIsConnecting(true);
            setError(null);

            try {
                const apiKey = import.meta.env.VITE_OPENAI_API_KEY || 
                               process.env.OPENAI_API_KEY || 
                               localStorage.getItem('openai_api_key') || '';
                
                if (!apiKey) {
                    setError('Clé API OpenAI manquante. Veuillez la configurer dans les paramètres.');
                    setIsConnecting(false);
                    return;
                }

                // Créer les outils
                const tools: RealtimeTool[] = [
                    {
                        name: 'create_blank_document',
                        description: 'Crée un nouveau document vierge avec un titre et un contenu initial',
                        parameters: {
                            type: 'object',
                            properties: {
                                title: { type: 'string', description: 'Le titre du document' },
                                content: { type: 'string', description: 'Le contenu initial du document' },
                                type: { 
                                    type: 'string', 
                                    description: 'Le type de document', 
                                    enum: ['contrat', 'proces-verbal', 'requete', 'memoire', 'autre'] 
                                }
                            },
                            required: ['title', 'content']
                        }
                    },
                    {
                        name: 'create_document_from_template',
                        description: 'Crée un document à partir d\'un modèle existant en remplissant les variables',
                        parameters: {
                            type: 'object',
                            properties: {
                                templateName: { 
                                    type: 'string', 
                                    description: 'Le nom du modèle à utiliser (ex: "contrat_bail", "proces_verbal")' 
                                },
                                variables: { 
                                    type: 'object', 
                                    description: 'Les variables à remplir dans le modèle (clé-valeur)' 
                                }
                            },
                            required: ['templateName', 'variables']
                        }
                    },
                    {
                        name: 'update_current_document',
                        description: 'Modifie le contenu du document actuellement ouvert',
                        parameters: {
                            type: 'object',
                            properties: {
                                content: { type: 'string', description: 'Le nouveau contenu complet du document' }
                            },
                            required: ['content']
                        }
                    },
                    {
                        name: 'get_current_document',
                        description: 'Récupère le contenu et les informations du document actuellement ouvert',
                        parameters: {
                            type: 'object',
                            properties: {}
                        }
                    }
                ];

                const contextInstruction = context ? `\n\nCONTEXTE ACTUEL:\n${context}\n` : '';
                
                serviceRef.current = new OpenAIRealtimeService({
                    apiKey,
                    voice: 'coral',
                    tools,
                    onToolCall: handleToolCall,
                    instructions: instructions || `Tu es Justicia, un assistant juridique expert en droit ivoirien. Tu peux créer et modifier des documents juridiques par la voix.${contextInstruction}

DIRECTIVES:
- Fournir des analyses juridiques approfondies et détaillées
- Citer systématiquement les sources légales (articles, codes, lois)
- Structurer les réponses : Synthèse → Analyse → Recommandations
- Utiliser un langage professionnel mais accessible
- Pour créer un document, utilise l'outil create_blank_document ou create_document_from_template
- Pour modifier un document ouvert, utilise update_current_document
- Pour consulter le document actuel, utilise get_current_document
- Confirme toujours les actions effectuées sur les documents`
                });

                // Écouter les événements
                serviceRef.current.on('conversation.item.input_audio_transcription.completed', (data: any) => {
                    if (data.transcript) {
                        setTranscript(prev => [...prev, { 
                            role: 'user', 
                            text: data.transcript, 
                            timestamp: new Date() 
                        }]);
                    }
                });

                serviceRef.current.on('response.audio_transcript.done', (data: any) => {
                    if (data.transcript) {
                        setTranscript(prev => [...prev, { 
                            role: 'assistant', 
                            text: data.transcript, 
                            timestamp: new Date() 
                        }]);
                    }
                });

                serviceRef.current.on('response.audio.delta', (data: any) => {
                    if (data.delta && serviceRef.current) {
                        serviceRef.current.playAudio(data.delta);
                    }
                });

                // Connecter
                await serviceRef.current.connect();
                await serviceRef.current.startAudioCapture();
                
                setIsConnected(true);
                console.log('[RealtimeVoiceChat] Connecté avec succès');
            } catch (err: any) {
                console.error('[RealtimeVoiceChat] Erreur de connexion:', err);
                setError(err.message || 'Erreur de connexion au service vocal');
            } finally {
                setIsConnecting(false);
            }
        };

        initService();

        // Cleanup
        return () => {
            if (serviceRef.current) {
                serviceRef.current.disconnect();
            }
        };
    }, [context, instructions]);

    // Sauvegarder la conversation avant de fermer
    const handleClose = () => {
        if (onSaveConversation && transcript.length > 0) {
            const messages = transcript.map(t => ({ role: t.role, content: t.text }));
            onSaveConversation(messages);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-purple-500/20">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutral-700">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${isConnected ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                            <Mic className={`w-6 h-6 ${isConnected ? 'text-green-400' : 'text-gray-400'}`} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Conversation Vocale avec Justicia</h2>
                            <p className="text-sm text-gray-400">
                                {isConnecting ? 'Connexion en cours...' : isConnected ? '🟢 Connecté - Parlez naturellement' : '🔴 Déconnecté'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-red-300">Erreur</p>
                            <p className="text-sm text-red-200 mt-1">{error}</p>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* Instructions */}
                    {transcript.length === 0 && !error && (
                        <div className="text-center py-12">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-500/20 mb-4">
                                <Mic className="w-10 h-10 text-purple-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">
                                Commencez à parler
                            </h3>
                            <p className="text-gray-400 max-w-md mx-auto">
                                Justicia vous écoute. Vous pouvez lui demander de créer des documents, 
                                modifier le document actuel, ou poser des questions juridiques.
                            </p>
                            <div className="mt-6 text-left max-w-md mx-auto space-y-2 text-sm text-gray-500">
                                <p>Exemples de commandes :</p>
                                <ul className="list-disc list-inside space-y-1 ml-4">
                                    <li>"Crée un nouveau contrat de bail"</li>
                                    <li>"Modifie le document pour ajouter une clause de résiliation"</li>
                                    <li>"Utilise le modèle de procès-verbal avec les noms Jean et Marie"</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Transcript */}
                    {transcript.map((entry, index) => (
                        <div
                            key={index}
                            className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                                    entry.role === 'user'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-neutral-700 text-gray-100'
                                }`}
                            >
                                <p className="text-sm font-medium mb-1">
                                    {entry.role === 'user' ? 'Vous' : 'Justicia'}
                                </p>
                                <p className="text-sm leading-relaxed">{entry.text}</p>
                                <p className="text-xs opacity-60 mt-2">
                                    {entry.timestamp.toLocaleTimeString()}
                                </p>
                            </div>
                        </div>
                    ))}

                    {/* Tool Calls */}
                    {toolCalls.map((call, index) => (
                        <div key={`tool-${index}`} className="flex justify-center">
                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg px-4 py-3 max-w-md">
                                <div className="flex items-center gap-2 mb-2">
                                    <FileText className="w-4 h-4 text-blue-400" />
                                    <p className="text-sm font-medium text-blue-300">Action effectuée</p>
                                </div>
                                <p className="text-xs text-gray-400">
                                    {call.tool === 'create_blank_document' && `Document "${call.args.title}" créé`}
                                    {call.tool === 'create_document_from_template' && `Document créé depuis le modèle "${call.args.templateName}"`}
                                    {call.tool === 'update_current_document' && 'Document mis à jour'}
                                    {call.tool === 'get_current_document' && 'Document consulté'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {call.timestamp.toLocaleTimeString()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-neutral-700">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-400">
                            {isConnected ? (
                                <span className="flex items-center gap-2">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                    </span>
                                    En écoute...
                                </span>
                            ) : (
                                'Déconnecté'
                            )}
                        </div>
                        <div className="text-sm text-gray-500">
                            {transcript.length} message{transcript.length > 1 ? 's' : ''} • {toolCalls.length} action{toolCalls.length > 1 ? 's' : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RealtimeVoiceChat;
