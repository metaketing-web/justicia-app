import React, { useState, useRef, useEffect } from 'react';
import { AudioWaveform, X, Check, Loader2, Mic, MicOff } from 'lucide-react';

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
  const [isListening, setIsListening] = useState(false);
  const [userSpeech, setUserSpeech] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleStartListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processVoiceCommand(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (error) {
      console.error('Erreur accès micro:', error);
      alert('Impossible d\'accéder au microphone');
    }
  };

  const handleStopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  const processVoiceCommand = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      // 1. Transcrire l'audio
      const formData = new FormData();
      formData.append('audio', audioBlob, 'command.webm');

      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });

      if (!transcribeResponse.ok) {
        throw new Error('Erreur transcription');
      }

      const transcribeData = await transcribeResponse.json();
      const userCommand = transcribeData.text || '';
      setUserSpeech(userCommand);

      // 2. Envoyer à l'IA pour modification du document
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userCommand,
          context: `Tu es un assistant d'édition de document. Voici le document actuel :

TITRE: ${title}

CONTENU:
${content}

L'utilisateur vient de dire : "${userCommand}"

Tu dois comprendre son instruction et modifier le document en conséquence.

RÈGLES IMPORTANTES:
1. Si l'instruction demande d'ajouter du contenu, ajoute-le au document existant
2. Si l'instruction demande de corriger, corrige le contenu existant
3. Si l'instruction demande de supprimer, supprime la partie concernée
4. Si l'instruction demande de reformuler, reformule le contenu
5. Si l'instruction demande de résumer, crée un résumé

Réponds UNIQUEMENT avec le nouveau contenu complet du document modifié.
Ne dis pas "Voici le document modifié" ou autre introduction.
Retourne DIRECTEMENT le nouveau contenu.`,
          sessionId: 'doc-edit-' + Date.now()
        })
      });

      if (!chatResponse.ok) {
        throw new Error('Erreur IA');
      }

      const reader = chatResponse.body?.getReader();
      const decoder = new TextDecoder();
      let aiResponseText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          aiResponseText += chunk;
          setAiResponse(aiResponseText);
        }
      }

      // 3. Mettre à jour le document avec la réponse de l'IA
      if (aiResponseText.trim()) {
        // Nettoyer la réponse si elle contient des préfixes
        let cleanedContent = aiResponseText.trim();
        
        // Retirer les préfixes courants
        const prefixes = [
          'DOCUMENT_UPDATE:',
          'Voici le document modifié :',
          'Voici le nouveau contenu :',
          'Document modifié :',
          'Nouveau contenu :'
        ];
        
        for (const prefix of prefixes) {
          if (cleanedContent.startsWith(prefix)) {
            cleanedContent = cleanedContent.substring(prefix.length).trim();
          }
        }
        
        onContentUpdate(cleanedContent);
      }

    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du traitement de la commande vocale');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-neutral-700">
        {/* Header */}
        <div className="p-6 border-b border-neutral-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
              <AudioWaveform className="w-7 h-7 text-cyan-400" />
              Modification Vocale du Document
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="bg-gradient-to-r from-cyan-900/30 via-blue-900/30 to-purple-900/30 border border-cyan-500/30 rounded-xl p-4">
            <p className="text-gray-300 text-sm mb-2">
              💡 <strong>Parlez à l'IA pour modifier le document</strong>
            </p>
            <p className="text-gray-400 text-xs">
              Exemples : "Ajoute une introduction", "Corrige l'orthographe", "Résume ce texte en 3 points", "Supprime le dernier paragraphe", "Reformule de manière plus formelle"
            </p>
          </div>
        </div>

        {/* Contrôles vocaux */}
        <div className="p-6 flex flex-col items-center gap-4">
          <button
            onClick={isListening ? handleStopListening : handleStartListening}
            disabled={isProcessing}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
              isListening
                ? 'bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 animate-pulse'
                : 'bg-gradient-to-r from-cyan-600 via-blue-500 to-purple-600 hover:from-cyan-700 hover:via-blue-600 hover:to-purple-700'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isListening ? (
              <MicOff className="w-12 h-12 text-white" />
            ) : (
              <Mic className="w-12 h-12 text-white" />
            )}
          </button>

          <div className="text-center">
            {isListening && (
              <p className="text-cyan-400 font-medium animate-pulse">
                🎤 Parlez maintenant...
              </p>
            )}
            {isProcessing && (
              <p className="text-blue-400 font-medium flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Traitement en cours...
              </p>
            )}
            {!isListening && !isProcessing && (
              <p className="text-gray-400">
                Cliquez pour commencer à parler
              </p>
            )}
          </div>

          {/* Transcription utilisateur */}
          {userSpeech && (
            <div className="w-full p-4 bg-neutral-800 rounded-lg border border-neutral-700">
              <p className="text-gray-400 text-xs mb-1">Vous avez dit :</p>
              <p className="text-white text-sm">{userSpeech}</p>
            </div>
          )}

          {/* Réponse IA */}
          {aiResponse && (
            <div className="w-full p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <p className="text-blue-300 text-xs mb-1">Modification appliquée :</p>
              <p className="text-blue-100 text-sm">{aiResponse.substring(0, 200)}...</p>
            </div>
          )}
        </div>

        {/* Aperçu du document */}
        <div className="flex-1 overflow-hidden p-6 border-t border-neutral-700">
          <h4 className="text-white font-medium mb-3">📄 Aperçu du document</h4>
          <div className="bg-neutral-800 rounded-lg p-4 h-full overflow-y-auto">
            <div className="text-gray-300 text-sm font-mono whitespace-pre-wrap">
              {content || '(Document vide)'}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-700 bg-neutral-900/50">
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-sm">
              🎙️ Parlez naturellement, l'IA comprendra vos instructions
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gradient-to-r from-cyan-600 via-blue-500 to-purple-600 hover:from-cyan-700 hover:via-blue-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all flex items-center gap-2"
            >
              <Check className="w-5 h-5" />
              Terminer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentVoiceEditor;
