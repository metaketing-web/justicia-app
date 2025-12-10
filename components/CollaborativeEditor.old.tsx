import React, { useState, useRef, useEffect } from 'react';
import { X, Save, Undo, Redo, Type, Pen, Eraser, Square, Circle, ArrowRight, Download, MessageCircle } from 'lucide-react';

interface CollaborativeEditorProps {
  initialContent: string;
  onSave: (content: string, annotations: any[], title?: string) => void;
  onClose: () => void;
  title?: string;
  onShowVoiceChat?: (context?: string, onTranscript?: (text: string) => void) => void;
}

interface Annotation {
  id: string;
  type: 'text' | 'highlight' | 'arrow' | 'rectangle' | 'circle' | 'freehand' | 'comment';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  color: string;
  strokeWidth: number;
  points?: { x: number; y: number }[];
  timestamp: number;
}

const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  initialContent,
  onSave,
  onClose,
  title = "Éditeur Collaboratif",
  onShowVoiceChat
}) => {
  const [content, setContent] = useState(initialContent);
  const [documentTitle, setDocumentTitle] = useState(title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentTool, setCurrentTool] = useState<'text' | 'pen' | 'eraser' | 'rectangle' | 'circle' | 'arrow' | 'comment'>('text');
  const [currentColor, setCurrentColor] = useState('#3B82F6');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
  const [history, setHistory] = useState<{ content: string; annotations: Annotation[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [commentPosition, setCommentPosition] = useState({ x: 0, y: 0 });
  const [commentText, setCommentText] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // const overlayRef = useRef<HTMLDivElement>(null);

  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#6B7280', '#000000'
  ];

  // Initialiser la reconnaissance vocale
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'fr-FR';
      
      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setAiPrompt(prev => prev + (prev ? ' ' : '') + transcript);
      };
      
      recognitionInstance.onend = () => {
        setIsRecording(false);
      };
      
      recognitionInstance.onerror = (event: any) => {
        console.error('Erreur de reconnaissance vocale:', event.error);
        setIsRecording(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, []);

  // Gérer la dictée vocale
  const toggleRecording = () => {
    if (!recognition) {
      alert('La reconnaissance vocale n\'est pas supportée par votre navigateur');
      return;
    }
    
    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.start();
      setIsRecording(true);
    }
  };

  // Sauvegarder l'état dans l'historique
  const saveToHistory = () => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ content, annotations });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Annuler la dernière action
  const undo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setContent(prevState.content);
      setAnnotations(prevState.annotations);
      setHistoryIndex(historyIndex - 1);
      redrawCanvas(prevState.annotations);
    }
  };

  // Refaire la dernière action annulée
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setContent(nextState.content);
      setAnnotations(nextState.annotations);
      setHistoryIndex(historyIndex + 1);
      redrawCanvas(nextState.annotations);
    }
  };

  // Redessiner le canvas avec toutes les annotations
  const redrawCanvas = (annotationsToRender: Annotation[] = annotations) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    annotationsToRender.forEach(annotation => {
      ctx.strokeStyle = annotation.color;
      ctx.lineWidth = annotation.strokeWidth;
      ctx.fillStyle = annotation.color;

      switch (annotation.type) {
        case 'freehand':
          if (annotation.points && annotation.points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
            annotation.points.forEach(point => ctx.lineTo(point.x, point.y));
            ctx.stroke();
          }
          break;
        case 'rectangle':
          ctx.strokeRect(annotation.x, annotation.y, annotation.width || 0, annotation.height || 0);
          break;
        case 'circle':
          const radius = Math.sqrt(Math.pow(annotation.width || 0, 2) + Math.pow(annotation.height || 0, 2)) / 2;
          ctx.beginPath();
          ctx.arc(annotation.x + (annotation.width || 0) / 2, annotation.y + (annotation.height || 0) / 2, radius, 0, 2 * Math.PI);
          ctx.stroke();
          break;
        case 'arrow':
          if (annotation.width && annotation.height) {
            const endX = annotation.x + annotation.width;
            const endY = annotation.y + annotation.height;
            
            // Ligne principale
            ctx.beginPath();
            ctx.moveTo(annotation.x, annotation.y);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            
            // Pointe de flèche
            const angle = Math.atan2(annotation.height, annotation.width);
            const arrowLength = 15;
            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(endX - arrowLength * Math.cos(angle - Math.PI / 6), endY - arrowLength * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(endX, endY);
            ctx.lineTo(endX - arrowLength * Math.cos(angle + Math.PI / 6), endY - arrowLength * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
          }
          break;
        case 'highlight':
          ctx.globalAlpha = 0.3;
          ctx.fillRect(annotation.x, annotation.y, annotation.width || 0, annotation.height || 0);
          ctx.globalAlpha = 1;
          break;
      }
    });
  };

  // Gérer le début du dessin
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentTool === 'comment') {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setCommentPosition({ 
          x: e.clientX - rect.left, 
          y: e.clientY - rect.top 
        });
        setShowCommentDialog(true);
      }
      return;
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    
    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      type: currentTool === 'pen' ? 'freehand' : currentTool as any,
      x,
      y,
      color: currentColor,
      strokeWidth,
      timestamp: Date.now(),
      points: currentTool === 'pen' ? [{ x, y }] : undefined
    };

    setCurrentAnnotation(newAnnotation);
  };

  // Gérer le dessin en cours
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentAnnotation) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentTool === 'pen') {
      const updatedAnnotation = {
        ...currentAnnotation,
        points: [...(currentAnnotation.points || []), { x, y }]
      };
      setCurrentAnnotation(updatedAnnotation);
      redrawCanvas([...annotations, updatedAnnotation]);
    } else {
      const updatedAnnotation = {
        ...currentAnnotation,
        width: x - currentAnnotation.x,
        height: y - currentAnnotation.y
      };
      setCurrentAnnotation(updatedAnnotation);
      redrawCanvas([...annotations, updatedAnnotation]);
    }
  };

  // Terminer le dessin
  const stopDrawing = () => {
    if (currentAnnotation && isDrawing) {
      setAnnotations([...annotations, currentAnnotation]);
      saveToHistory();
    }
    setIsDrawing(false);
    setCurrentAnnotation(null);
  };

  // Ajouter un commentaire
  const addComment = () => {
    if (commentText.trim()) {
      const newComment: Annotation = {
        id: Date.now().toString(),
        type: 'comment',
        x: commentPosition.x,
        y: commentPosition.y,
        text: commentText,
        color: currentColor,
        strokeWidth: 1,
        timestamp: Date.now()
      };
      setAnnotations([...annotations, newComment]);
      saveToHistory();
    }
    setShowCommentDialog(false);
    setCommentText('');
  };

  // Sauvegarder les modifications
  const handleSave = () => {
    onSave(content, annotations, documentTitle);
  };

  // Exporter en Word avec en-tête PORTEO
  const exportAsWord = async () => {
    try {
      if (!content || content.trim() === '') {
        alert('Le document est vide et ne peut pas être téléchargé');
        return;
      }
      
      console.log('[Export Word] Téléchargement de:', documentTitle, 'Taille:', content.length);
      
      const response = await fetch('/api/word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      
      if (!response.ok) throw new Error('Erreur lors de la génération');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${documentTitle.replace(/[^a-z0-9]/gi, '_')}_porteo.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la génération du document Word');
    }
  };

  useEffect(() => {
    // Initialiser l'historique
    setHistory([{ content: initialContent, annotations: [] }]);
    setHistoryIndex(0);
  }, []);

  useEffect(() => {
    redrawCanvas();
  }, [annotations]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-neutral-900 rounded-xl shadow-2xl w-[95vw] h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-700">
          {isEditingTitle ? (
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditingTitle(false);
                }
                if (e.key === 'Escape') {
                  setDocumentTitle(title);
                  setIsEditingTitle(false);
                }
              }}
              autoFocus
              className="text-xl font-bold text-white bg-neutral-800 px-3 py-1 rounded-lg border border-neutral-600 focus:outline-none focus:border-blue-500 min-w-[300px]"
            />
          ) : (
            <div className="flex items-center gap-2 group">
              <h2 className="text-xl font-bold text-white">{documentTitle}</h2>
              <button
                onClick={() => setIsEditingTitle(true)}
                className="p-1.5 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                title="Modifier le titre"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Undo size={20} />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Redo size={20} />
            </button>
            <button
              onClick={exportAsWord}
              className="p-2 text-gray-400 hover:text-white"
              title="Télécharger en Word"
            >
              <Download size={20} />
            </button>
            {onShowVoiceChat && (
              <button
                onClick={() => onShowVoiceChat(content, (transcript) => {
                  // Ajouter la transcription au contenu existant
                  setContent(prev => prev + (prev ? '\n\n' : '') + transcript);
                  saveToHistory();
                })}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white rounded-lg hover:from-purple-700 hover:via-pink-600 hover:to-orange-600 flex items-center gap-2"
                title="Dicter vocalement"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                Vocal
              </button>
            )}
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white rounded-lg hover:from-purple-700 hover:via-pink-600 hover:to-orange-600 flex items-center gap-2"
            >
              <Save size={16} />
              Sauvegarder
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 p-4 border-b border-neutral-700 bg-neutral-800">
          {/* Outils */}
          <div className="flex items-center gap-2">
            {[
              { tool: 'text', icon: Type, label: 'Texte' },
              { tool: 'pen', icon: Pen, label: 'Stylo' },
              { tool: 'eraser', icon: Eraser, label: 'Gomme' },
              { tool: 'rectangle', icon: Square, label: 'Rectangle' },
              { tool: 'circle', icon: Circle, label: 'Cercle' },
              { tool: 'arrow', icon: ArrowRight, label: 'Flèche' },
              { tool: 'comment', icon: MessageCircle, label: 'Commentaire' }
            ].map(({ tool, icon: Icon, label }) => (
              <button
                key={tool}
                onClick={() => setCurrentTool(tool as any)}
                className={`p-2 rounded-lg ${
                  currentTool === tool 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-neutral-700'
                }`}
                title={label}
              >
                <Icon size={18} />
              </button>
            ))}
          </div>

          {/* Couleurs */}
          <div className="flex items-center gap-1">
            {colors.map(color => (
              <button
                key={color}
                onClick={() => setCurrentColor(color)}
                className={`w-6 h-6 rounded-full border-2 ${
                  currentColor === color ? 'border-white' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          {/* Épaisseur du trait */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Épaisseur:</span>
            <input
              type="range"
              min="1"
              max="10"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-20"
            />
            <span className="text-sm text-gray-400">{strokeWidth}px</span>
          </div>
        </div>

        {/* Zone d'édition */}
        <div className="flex-1 flex pb-32">
          {/* Éditeur de texte */}
          <div className="w-1/2 border-r border-neutral-700">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full p-4 bg-neutral-800 text-white resize-none border-none outline-none text-sm"
              style={{ fontFamily: 'Arial, sans-serif' }}
              placeholder="Modifiez le contenu ici..."
            />
          </div>

          {/* Canvas d'annotation */}
          <div className="w-1/2 relative">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="w-full h-full bg-transparent cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />

            {/* Commentaires */}
            {annotations
              .filter(a => a.type === 'comment')
              .map(comment => (
                <div
                  key={comment.id}
                  className="absolute bg-yellow-200 text-black p-2 rounded shadow-lg text-xs max-w-48"
                  style={{
                    left: comment.x,
                    top: comment.y,
                    transform: 'translate(-50%, -100%)'
                  }}
                >
                  {comment.text}
                </div>
              ))
            }
          </div>
        </div>

        {/* Zone de prompt IA en bas */}
        <div className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-700 p-4 shadow-2xl z-50">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!aiPrompt.trim() || isProcessingAI) return;
              
              setIsProcessingAI(true);
              try {
                // Appel à l'endpoint backend local qui utilise votre clé OpenAI
                const response = await fetch('/api/chat', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    message: content.trim() 
                      ? `Contexte actuel du document:\n${content}\n\nInstruction: ${aiPrompt}`
                      : aiPrompt,
                    conversationHistory: []
                  })
                });
                
                if (!response.ok) {
                  const errorText = await response.text();
                  throw new Error(`Erreur API: ${errorText}`);
                }
                
                const data = await response.json();
                const modifiedContent = data.response || content;
                
                setContent(modifiedContent);
                saveToHistory();
                setAiPrompt('');
              } catch (error) {
                console.error('Erreur lors du traitement IA:', error);
                alert('Erreur lors du traitement de votre demande');
              } finally {
                setIsProcessingAI(false);
              }
            }} className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2 bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3">
                <svg className="w-5 h-5 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <textarea
                  ref={promptInputRef}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      e.currentTarget.form?.requestSubmit();
                    }
                  }}
                  placeholder="Demandez à l'IA de modifier le document (ex: 'Corriger l'orthographe', 'Résumer en 3 paragraphes', 'Ajouter une conclusion')..."
                  className="flex-1 bg-transparent text-white placeholder-gray-500 border-0 outline-none resize-none text-sm"
                  rows={1}
                  disabled={isProcessingAI}
                  style={{ maxHeight: '120px' }}
                />
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`p-2 rounded-lg transition-all ${
                    isRecording
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-neutral-700 text-gray-400 hover:bg-neutral-600 hover:text-white'
                  }`}
                  title={isRecording ? 'Arrêter l\'enregistrement' : 'Dicter le texte'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
              </div>
              <button
                type="submit"
                disabled={!aiPrompt.trim() || isProcessingAI}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  aiPrompt.trim() && !isProcessingAI
                    ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white hover:shadow-lg hover:shadow-purple-500/50'
                    : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
                }`}
              >
                {isProcessingAI ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Traitement...</span>
                  </div>
                ) : (
                  'Modifier'
                )}
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-2 text-center">
              L'IA modifiera le document en temps réel selon vos instructions • <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded">Entrée</kbd> pour envoyer
            </p>
          </div>
        </div>

        {/* Dialog de commentaire */}
        {showCommentDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white p-4 rounded-lg shadow-xl">
              <h3 className="text-lg font-bold mb-2">Ajouter un commentaire</h3>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-64 h-20 p-2 border rounded resize-none"
                placeholder="Tapez votre commentaire..."
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setShowCommentDialog(false)}
                  className="px-3 py-1 text-gray-600 hover:text-gray-800"
                >
                  Annuler
                </button>
                <button
                  onClick={addComment}
                  className="px-3 py-1 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white rounded hover:from-purple-700 hover:via-pink-600 hover:to-orange-600"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollaborativeEditor;
