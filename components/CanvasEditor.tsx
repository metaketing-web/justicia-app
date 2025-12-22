import React, { useState } from 'react';
import { X, Download, Edit3, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface CanvasEditorProps {
  initialMarkdown: string;
  title: string;
  onClose: () => void;
  onSave?: (markdown: string) => void;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({
  initialMarkdown,
  title,
  onClose,
  onSave
}) => {
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [mode, setMode] = useState<'edit' | 'preview'>('preview');

  const handleExport = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(markdown);
    }
    alert('Document sauvegardé !');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-700">
          <div>
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            <p className="text-sm text-gray-400">Éditeur Markdown</p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Mode Toggle */}
            <div className="flex bg-neutral-800 rounded-lg p-1">
              <button
                onClick={() => setMode('edit')}
                className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                  mode === 'edit'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                Éditer
              </button>
              <button
                onClick={() => setMode('preview')}
                className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                  mode === 'preview'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Eye className="w-4 h-4" />
                Aperçu
              </button>
            </div>

            {/* Actions */}
            {onSave && (
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Sauvegarder
              </button>
            )}
            
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              Exporter .md
            </button>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {mode === 'edit' ? (
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              className="w-full h-full p-6 bg-neutral-900 text-white font-mono text-sm resize-none focus:outline-none"
              placeholder="Écrivez votre contenu en Markdown..."
            />
          ) : (
            <div className="h-full overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto prose prose-invert prose-lg">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {markdown}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-700 bg-neutral-800">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div>
              {mode === 'edit' ? (
                <span>💡 Utilisez la syntaxe Markdown : # Titre, **gras**, *italique*, etc.</span>
              ) : (
                <span>👁️ Mode aperçu - Cliquez sur "Éditer" pour modifier</span>
              )}
            </div>
            <div>
              {markdown.length} caractères
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasEditor;
