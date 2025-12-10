import React, { useState, useRef } from 'react';
import { FileText, Download, ArrowLeft, Loader2, Bold, Italic, List, ListOrdered, Type, Mic, AudioWaveform, X } from 'lucide-react';
import DocumentVoiceEditor from './DocumentVoiceEditor';

interface BlankDocumentEditorProps {
  onBack: () => void;
  onGenerate: (title: string, content: string) => Promise<void>;
}

const BlankDocumentEditor: React.FC<BlankDocumentEditorProps> = ({ onBack, onGenerate }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showRealtimeVoice, setShowRealtimeVoice] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleGenerate = async () => {
    if (!title.trim()) {
      alert('Veuillez saisir un titre pour le document');
      return;
    }

    if (!content.trim()) {
      alert('Veuillez saisir du contenu pour le document');
      return;
    }

    setIsGenerating(true);
    try {
      await onGenerate(title, content);
    } catch (error) {
      console.error('Erreur génération:', error);
      alert('Erreur lors de la génération du document');
    } finally {
      setIsGenerating(false);
    }
  };

  const insertFormatting = (format: string) => {
    const textarea = document.getElementById('content-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let newText = '';
    let cursorOffset = 0;

    switch (format) {
      case 'bold':
        newText = `**${selectedText || 'texte en gras'}**`;
        cursorOffset = selectedText ? 2 : 2;
        break;
      case 'italic':
        newText = `*${selectedText || 'texte en italique'}*`;
        cursorOffset = selectedText ? 1 : 1;
        break;
      case 'heading':
        newText = `### ${selectedText || 'Titre'}`;
        cursorOffset = selectedText ? 4 : 4;
        break;
      case 'bullet':
        newText = `\n- ${selectedText || 'élément de liste'}`;
        cursorOffset = selectedText ? 3 : 3;
        break;
      case 'number':
        newText = `\n1. ${selectedText || 'élément numéroté'}`;
        cursorOffset = selectedText ? 4 : 4;
        break;
    }

    const newContent = content.substring(0, start) + newText + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset + (selectedText ? selectedText.length : newText.length - cursorOffset * 2));
    }, 0);
  };

  // Transcription audio (Speech-to-Text)
  const handleMicToggle = async () => {
    if (isRecording) {
      // Arrêter l'enregistrement
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Démarrer l'enregistrement
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
          
          // Envoyer à l'API de transcription
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');

          try {
            const response = await fetch('/api/transcribe', {
              method: 'POST',
              body: formData
            });

            if (response.ok) {
              const data = await response.json();
              const transcription = data.text || '';
              
              // Ajouter la transcription au contenu
              setContent(prev => prev + '\n\n' + transcription);
            } else {
              console.error('Erreur transcription');
            }
          } catch (error) {
            console.error('Erreur:', error);
          }

          // Arrêter le stream
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Erreur accès micro:', error);
        alert('Impossible d\'accéder au microphone');
      }
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-neutral-700">
          {/* Header */}
          <div className="p-6 border-b border-neutral-700">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <FileText className="w-7 h-7 text-purple-400" />
                  Nouveau Document Vierge
                </h2>
                <p className="text-gray-400 text-sm mt-1">Créez un document Word avec en-tête Porteo</p>
              </div>
              
              {/* Boutons vocaux */}
              <div className="flex gap-2">
                <button
                  onClick={handleMicToggle}
                  className={`p-3 rounded-lg transition-all ${
                    isRecording
                      ? 'bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white animate-pulse'
                      : 'bg-neutral-800 text-gray-400 hover:bg-neutral-700'
                  }`}
                  title="Transcription audio (Speech-to-Text)"
                >
                  <Mic className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowRealtimeVoice(true)}
                  className="p-3 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 hover:from-blue-700 hover:via-cyan-600 hover:to-teal-600 text-white rounded-lg transition-all"
                  title="Conversation vocale Real-time avec l'IA"
                >
                  <AudioWaveform className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Titre du document */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre du document..."
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-lg font-semibold placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Barre d'outils */}
          <div className="px-6 py-3 border-b border-neutral-700 bg-neutral-800/50">
            <div className="flex items-center gap-2">
              <button
                onClick={() => insertFormatting('heading')}
                className="p-2 text-gray-400 hover:text-white hover:bg-neutral-700 rounded transition-colors"
                title="Titre"
              >
                <Type className="w-5 h-5" />
              </button>
              <button
                onClick={() => insertFormatting('bold')}
                className="p-2 text-gray-400 hover:text-white hover:bg-neutral-700 rounded transition-colors"
                title="Gras"
              >
                <Bold className="w-5 h-5" />
              </button>
              <button
                onClick={() => insertFormatting('italic')}
                className="p-2 text-gray-400 hover:text-white hover:bg-neutral-700 rounded transition-colors"
                title="Italique"
              >
                <Italic className="w-5 h-5" />
              </button>
              <div className="w-px h-6 bg-neutral-700 mx-2"></div>
              <button
                onClick={() => insertFormatting('bullet')}
                className="p-2 text-gray-400 hover:text-white hover:bg-neutral-700 rounded transition-colors"
                title="Liste à puces"
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => insertFormatting('number')}
                className="p-2 text-gray-400 hover:text-white hover:bg-neutral-700 rounded transition-colors"
                title="Liste numérotée"
              >
                <ListOrdered className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Éditeur */}
          <div className="flex-1 overflow-hidden p-6">
            <textarea
              id="content-editor"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Commencez à écrire votre document...

Astuces :
- ### pour un titre
- **texte** pour du gras
- *texte* pour de l'italique
- - pour une liste à puces
- 1. pour une liste numérotée

🎤 Micro : Dictée vocale (transcription)
🌊 Vagues : Conversation avec l'IA pour modifier le document"
              className="w-full h-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-mono text-sm"
            />
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-neutral-700 bg-neutral-900/50 flex items-center justify-between">
            <div className="text-gray-400 text-sm">
              <p>📄 Document avec en-tête Porteo Group 2025</p>
              <p className="text-xs mt-1">🎤 Micro = Transcription • 🌊 Vagues = Conversation IA</p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !title.trim() || !content.trim()}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 hover:from-purple-700 hover:via-pink-600 hover:to-orange-600 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Générer le Document
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Voice Editor */}
      {showRealtimeVoice && (
        <DocumentVoiceEditor
          title={title}
          content={content}
          onContentUpdate={(newContent) => setContent(newContent)}
          onClose={() => setShowRealtimeVoice(false)}
        />
      )}
    </>
  );
};

export default BlankDocumentEditor;
