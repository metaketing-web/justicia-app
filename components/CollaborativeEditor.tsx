import React, { useState, useRef } from 'react';
import { X, Save, Undo, Redo, Download, Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Indent, Outdent, Link, Image as ImageIcon, Table, Eye, Edit3 } from 'lucide-react';
import { VoiceButton } from './VoiceButton';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import JusticiaLoader from './JusticiaLoader';
import { useVoiceInput } from '../hooks/useVoiceInput';

interface CollaborativeEditorProps {
  initialContent: string;
  onSave: (content: string, title?: string) => void;
  onClose: () => void;
  title?: string;
  onShowVoiceChat?: (context?: string, onTranscript?: (text: string) => void) => void;
}

const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  initialContent,
  onSave,
  onClose,
  title = "Éditeur de Document",
  onShowVoiceChat
}) => {
  const [content, setContent] = useState(initialContent);
  const [documentTitle, setDocumentTitle] = useState(title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [history, setHistory] = useState<string[]>([initialContent]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  // Hook audio pour écrire par la voix
  const voiceInput = useVoiceInput({
    onTranscript: (text) => {
      // Ajouter le texte transcrit au contenu actuel
      const newContent = content + (content ? '\n' : '') + text;
      setContent(newContent);
      saveToHistory(newContent);
    },
    onError: (error) => {
      console.error('[Editor] Erreur audio:', error);
      alert(error);
    }
  });

  // Hook audio pour la zone de prompt IA
  const voicePrompt = useVoiceInput({
    onTranscript: (text) => {
      setAiPrompt(prev => prev + (prev ? ' ' : '') + text);
    },
    onError: (error) => {
      console.error('[Editor] Erreur audio prompt:', error);
      alert(error);
    }
  });

  // Sauvegarder dans l'historique
  const saveToHistory = (newContent: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newContent);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setContent(history[historyIndex - 1]);
    }
  };

  // Redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setContent(history[historyIndex + 1]);
    }
  };

  // Appliquer un formatage
  const applyFormatting = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const newContent = 
      content.substring(0, start) +
      prefix + selectedText + suffix +
      content.substring(end);
    
    setContent(newContent);
    saveToHistory(newContent);
    
    // Repositionner le curseur
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  // Commandes de formatage
  const formatBold = () => applyFormatting('**', '**');
  const formatItalic = () => applyFormatting('*', '*');
  const formatUnderline = () => applyFormatting('<u>', '</u>');
  const formatStrikethrough = () => applyFormatting('~~', '~~');
  
  const formatHeading1 = () => applyFormatting('# ', '');
  const formatHeading2 = () => applyFormatting('## ', '');
  const formatHeading3 = () => applyFormatting('### ', '');
  
  const formatBulletList = () => applyFormatting('- ', '');
  const formatNumberedList = () => applyFormatting('1. ', '');
  
  const insertLink = () => {
    const url = prompt('Entrez l\'URL :');
    if (url) {
      applyFormatting('[', `](${url})`);
    }
  };

  // Sauvegarder
  const handleSave = () => {
    onSave(content, documentTitle);
  };

  // Télécharger en Markdown
  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentTitle.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Demander à l'IA de modifier le document
  const handleAIModification = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsProcessingAI(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Voici le document actuel:\n\n${content}\n\nInstruction: ${aiPrompt}\n\nRéponds uniquement avec le document modifié, sans commentaire.`,
          ragContext: '',
          webSearchResults: ''
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      if (!data || !data.response) {
        throw new Error('Réponse API invalide');
      }
      const modifiedContent = data.response;
      
      setContent(modifiedContent);
      saveToHistory(modifiedContent);
      setAiPrompt('');
    } catch (error) {
      console.error('Erreur IA:', error);
      alert('Erreur lors de la modification par l\'IA');
    } finally {
      setIsProcessingAI(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* En-tête */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-700">
          <div className="flex items-center gap-4 flex-1">
            {isEditingTitle ? (
              <input
                type="text"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                className="text-xl font-bold bg-neutral-800 text-white px-3 py-1 rounded border border-neutral-600 focus:outline-none focus:border-purple-500"
                autoFocus
              />
            ) : (
              <h2
                onClick={() => setIsEditingTitle(true)}
                className="text-xl font-bold text-white cursor-pointer hover:text-purple-400"
              >
                {documentTitle}
              </h2>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={historyIndex === 0}
              className="p-2 hover:bg-neutral-800 rounded disabled:opacity-30"
              title="Annuler (Ctrl+Z)"
            >
              <Undo className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex === history.length - 1}
              className="p-2 hover:bg-neutral-800 rounded disabled:opacity-30"
              title="Rétablir (Ctrl+Y)"
            >
              <Redo className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-neutral-800 rounded"
              title="Télécharger (Markdown)"
            >
              <Download className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`p-2 hover:bg-neutral-800 rounded ${ isPreviewMode ? 'bg-purple-600' : ''}`}
              title={isPreviewMode ? "Mode Édition" : "Mode Prévisualisation"}
            >
              {isPreviewMode ? <Edit3 className="w-5 h-5 text-white" /> : <Eye className="w-5 h-5 text-white" />}
            </button>
            <VoiceButton
              isRecording={voiceInput.isRecording}
              onClick={voiceInput.toggleRecording}
              disabled={voiceInput.isProcessing}
              size="lg"
            />
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 hover:from-purple-700 hover:via-pink-600 hover:to-orange-600 text-white rounded-lg font-semibold"
            >
              <Save className="w-5 h-5 inline mr-2" />
              Sauvegarder
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-800 rounded"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Barre d'outils de formatage */}
        <div className="flex items-center gap-1 p-2 border-b border-neutral-700 bg-neutral-800/50 flex-wrap">
          {/* Formatage de texte */}
          <button
            onClick={formatBold}
            className="p-2 hover:bg-neutral-700 rounded"
            title="Gras (Ctrl+B)"
          >
            <Bold className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={formatItalic}
            className="p-2 hover:bg-neutral-700 rounded"
            title="Italique (Ctrl+I)"
          >
            <Italic className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={formatUnderline}
            className="p-2 hover:bg-neutral-700 rounded"
            title="Soulignement (Ctrl+U)"
          >
            <Underline className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={formatStrikethrough}
            className="p-2 hover:bg-neutral-700 rounded"
            title="Barré"
          >
            <Strikethrough className="w-5 h-5 text-white" />
          </button>

          <div className="w-px h-6 bg-neutral-600 mx-1" />

          {/* Titres */}
          <button
            onClick={formatHeading1}
            className="px-3 py-2 hover:bg-neutral-700 rounded text-white font-bold"
            title="Titre 1"
          >
            H1
          </button>
          <button
            onClick={formatHeading2}
            className="px-3 py-2 hover:bg-neutral-700 rounded text-white font-bold"
            title="Titre 2"
          >
            H2
          </button>
          <button
            onClick={formatHeading3}
            className="px-3 py-2 hover:bg-neutral-700 rounded text-white font-bold"
            title="Titre 3"
          >
            H3
          </button>

          <div className="w-px h-6 bg-neutral-600 mx-1" />

          {/* Listes */}
          <button
            onClick={formatBulletList}
            className="p-2 hover:bg-neutral-700 rounded"
            title="Liste à puces"
          >
            <List className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={formatNumberedList}
            className="p-2 hover:bg-neutral-700 rounded"
            title="Liste numérotée"
          >
            <ListOrdered className="w-5 h-5 text-white" />
          </button>

          <div className="w-px h-6 bg-neutral-600 mx-1" />

          {/* Insertion */}
          <button
            onClick={insertLink}
            className="p-2 hover:bg-neutral-700 rounded"
            title="Insérer un lien"
          >
            <Link className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Zone d'édition */}
        <div className="flex-1 p-4 overflow-auto">
          {isPreviewMode ? (
            <div className="w-full h-full bg-white text-black p-8 rounded-lg prose prose-lg max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                saveToHistory(e.target.value);
              }}
              className="w-full h-full bg-neutral-800 text-white p-4 rounded-lg border border-neutral-700 focus:outline-none focus:border-purple-500 font-mono text-sm resize-none"
              placeholder="Commencez à écrire votre document..."
            />
          )}
        </div>

        {/* Assistant IA */}
        <div className="p-4 border-t border-neutral-700 bg-neutral-800/50">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={promptInputRef}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAIModification();
                  }
                }}
                placeholder="Demandez à l'IA de modifier le document (ex: 'Ajoute une introduction', 'Corrige l'orthographe', 'Résume ce texte')..."
                className="w-full bg-neutral-700 text-white p-3 pr-12 rounded-lg border border-neutral-600 focus:outline-none focus:border-purple-500 resize-none"
                rows={2}
                disabled={isProcessingAI}
              />
              <div className="absolute right-2 top-2">
                <VoiceButton
                  isRecording={voicePrompt.isRecording}
                  onClick={voicePrompt.toggleRecording}
                  disabled={voicePrompt.isProcessing || isProcessingAI}
                  size="md"
                />
              </div>
            </div>
            <button
              onClick={handleAIModification}
              disabled={isProcessingAI || !aiPrompt.trim()}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 hover:from-purple-700 hover:via-pink-600 hover:to-orange-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              title={isProcessingAI ? "Modification en cours..." : "Modifier le document avec l'IA"}
            >
              {isProcessingAI ? (
                <span className="flex items-center gap-2">
                  <img src="/justicia_loader_perfect.gif" alt="Loading" className="w-5 h-5" />
                  Modification en cours...
                </span>
              ) : '✨ Modifier avec l\'IA'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaborativeEditor;
