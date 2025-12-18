import React, { useState, useEffect, useRef } from 'react';
import { AudioWaveform, X, Mic, Loader2, FileText, AlertCircle } from 'lucide-react';
import { OpenAIRealtimeService, RealtimeTool } from '../services/openai-realtime.service';

interface DocumentVoiceEditorProps {
  title: string;
  content: string;
  onContentUpdate: (newContent: string) => void;
  onClose: () => void;
}

const DocumentVoiceEditor: React.FC<DocumentVoiceEditorProps> = ({
  title,
  content,
  onContentUpdate,
  onClose
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<Array<{ role: 'user' | 'assistant', text: string, timestamp: Date }>>([]);
  const [modifications, setModifications] = useState<Array<{ action: string, timestamp: Date }>>([]);
  
  const serviceRef = useRef<OpenAIRealtimeService | null>(null);
  const currentContentRef = useRef(content);

  // Mettre à jour la référence du contenu
  useEffect(() => {
    currentContentRef.current = content;
  }, [content]);

  // Gestionnaire d'appels d'outils
  const handleToolCall = async (toolName: string, args: any) => {
    console.log(`[DocumentVoiceEditor] Appel d'outil: ${toolName}`, args);
    
    const timestamp = new Date();
    
    try {
      switch (toolName) {
        case 'update_document_content':
          onContentUpdate(args.content);
          setModifications(prev => [...prev, { 
            action: 'Document mis à jour complètement', 
            timestamp 
          }]);
          return { success: true, message: 'Document mis à jour avec succès' };
        
        case 'insert_text':
          const newContent = currentContentRef.current + '\n\n' + args.text;
          onContentUpdate(newContent);
          setModifications(prev => [...prev, { 
            action: `Texte ajouté: "${args.text.substring(0, 50)}..."`, 
            timestamp 
          }]);
          return { success: true, message: 'Texte ajouté avec succès' };
        
        case 'replace_text':
          const replacedContent = currentContentRef.current.replace(args.search, args.replace);
          if (replacedContent === currentContentRef.current) {
            return { success: false, message: 'Texte non trouvé dans le document' };
          }
          onContentUpdate(replacedContent);
          setModifications(prev => [...prev, { 
            action: `Texte remplacé: "${args.search}" → "${args.replace}"`, 
            timestamp 
          }]);
          return { success: true, message: 'Texte remplacé avec succès' };
        
        case 'get_document_content':
          return { 
            success: true, 
            title,
            content: currentContentRef.current,
            length: currentContentRef.current.length 
          };
        
        default:
          return { success: false, message: `Outil inconnu: ${toolName}` };
      }
    } catch (error: any) {
      console.error(`[DocumentVoiceEditor] Erreur lors de l'exécution de ${toolName}:`, error);
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
            name: 'update_document_content',
            description: 'Remplace tout le contenu du document par un nouveau contenu',
            parameters: {
              type: 'object',
              properties: {
                content: { type: 'string', description: 'Le nouveau contenu complet du document' }
              },
              required: ['content']
            }
          },
          {
            name: 'insert_text',
            description: 'Ajoute du texte à la fin du document',
            parameters: {
              type: 'object',
              properties: {
                text: { type: 'string', description: 'Le texte à ajouter' }
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
                search: { type: 'string', description: 'Le texte à rechercher' },
                replace: { type: 'string', description: 'Le texte de remplacement' }
              },
              required: ['search', 'replace']
            }
          },
          {
            name: 'get_document_content',
            description: 'Récupère le contenu actuel du document',
            parameters: {
              type: 'object',
              properties: {}
            }
          }
        ];
        
        serviceRef.current = new OpenAIRealtimeService({
          apiKey,
          voice: 'coral',
          tools,
          onToolCall: handleToolCall,
          instructions: `Tu es Justicia, un assistant d'édition de documents juridiques. Tu aides l'utilisateur à modifier le document suivant :

TITRE: ${title}

CONTENU ACTUEL:
${content}

DIRECTIVES:
- Écoute attentivement les instructions de l'utilisateur
- Utilise les outils pour modifier le document selon ses demandes
- Confirme toujours les modifications effectuées
- Si tu n'es pas sûr de ce que l'utilisateur veut, demande des précisions
- Sois précise et professionnelle dans tes réponses
- Utilise update_document_content pour remplacer tout le contenu
- Utilise insert_text pour ajouter du texte
- Utilise replace_text pour remplacer une partie spécifique
- Utilise get_document_content pour lire le contenu actuel avant de le modifier`
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
        console.log('[DocumentVoiceEditor] Connecté avec succès');
      } catch (err: any) {
        console.error('[DocumentVoiceEditor] Erreur de connexion:', err);
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
  }, [title, content]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-purple-500/20">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-700">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${isConnected ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
              <AudioWaveform className={`w-6 h-6 ${isConnected ? 'text-green-400' : 'text-gray-400'}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Modification Vocale</h2>
              <p className="text-sm text-gray-400">
                {isConnecting ? 'Connexion en cours...' : isConnected ? '🟢 En écoute - Dictez vos modifications' : '🔴 Déconnecté'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
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
          {/* Document Info */}
          <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-purple-400" />
              <p className="text-sm font-medium text-purple-300">Document en cours d'édition</p>
            </div>
            <p className="text-white font-semibold">{title}</p>
            <p className="text-xs text-gray-400 mt-1">{content.length} caractères</p>
          </div>

          {/* Instructions */}
          {transcript.length === 0 && !error && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/20 mb-4">
                <Mic className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Parlez pour modifier le document
              </h3>
              <p className="text-gray-400 max-w-md mx-auto text-sm">
                Justicia vous écoute. Dictez vos modifications et elle les appliquera en temps réel.
              </p>
              <div className="mt-6 text-left max-w-md mx-auto space-y-2 text-xs text-gray-500">
                <p>Exemples de commandes :</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>"Ajoute une clause de confidentialité"</li>
                  <li>"Remplace 'partie' par 'contractant'"</li>
                  <li>"Lis-moi le contenu actuel"</li>
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
                <p className="text-xs font-medium mb-1 opacity-75">
                  {entry.role === 'user' ? 'Vous' : 'Justicia'}
                </p>
                <p className="text-sm leading-relaxed">{entry.text}</p>
                <p className="text-xs opacity-50 mt-2">
                  {entry.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {/* Modifications */}
          {modifications.map((mod, index) => (
            <div key={`mod-${index}`} className="flex justify-center">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg px-4 py-2 max-w-md">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <p className="text-xs text-blue-300">{mod.action}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {mod.timestamp.toLocaleTimeString()}
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
                  Justicia vous écoute...
                </span>
              ) : (
                'Déconnecté'
              )}
            </div>
            <div className="text-sm text-gray-500">
              {modifications.length} modification{modifications.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentVoiceEditor;
