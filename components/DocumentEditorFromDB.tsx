import React, { useState, useEffect } from 'react';
import { X, Save, Download, Loader2, AlertCircle } from 'lucide-react';
import { trpc } from '../lib/trpc';
import { generateWordDocument } from '../services/wordDocumentService';

interface DocumentEditorFromDBProps {
  documentId: number;
  onClose: () => void;
  onSave?: () => void;
}

const DocumentEditorFromDB: React.FC<DocumentEditorFromDBProps> = ({ documentId, onClose, onSave }) => {
  const [document, setDocument] = useState<any>(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDocument();
  }, [documentId]);

  const loadDocument = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get document metadata
      const doc = await trpc.documents.getById.query({ id: documentId });
      setDocument(doc);
      setTitle(doc.title);

      // Get download URL and fetch content
      const { url } = await trpc.documents.getDownloadUrl.query({ id: documentId });
      const response = await fetch(url);
      const text = await response.text();
      setContent(text);
    } catch (err: any) {
      console.error('[DocumentEditorFromDB] Error loading document:', err);
      setError('Erreur lors du chargement du document');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Update document via tRPC
      await trpc.documents.update.mutate({
        id: documentId,
        title,
        metadata: {
          ...document.metadata,
          lastModified: new Date().toISOString(),
          wordCount: content.split(/\s+/).length,
          charCount: content.length,
        },
      });

      // Upload new content to S3
      const blob = new Blob([content], { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', blob, `${title}.txt`);

      await trpc.documents.upload.mutate({
        file: blob,
        type: document.type,
        metadata: {
          documentId,
          updated: true,
        },
      });

      alert('Document sauvegardé avec succès !');
      if (onSave) onSave();
    } catch (err: any) {
      console.error('[DocumentEditorFromDB] Error saving:', err);
      setError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    try {
      const blob = await generateWordDocument({
        title,
        content,
        headerType: document.type === 'created' || document.type === 'template' ? 'porteo' : 'justicia',
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/[^a-z0-9]/gi, '_')}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[DocumentEditorFromDB] Error downloading:', err);
      alert('Erreur lors du téléchargement');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-neutral-900 rounded-2xl p-8 border border-neutral-700">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto" />
          <p className="text-white mt-4">Chargement du document...</p>
        </div>
      </div>
    );
  }

  if (error && !document) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-neutral-900 rounded-2xl p-8 border border-neutral-700 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-white text-center mb-4">{error}</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col border border-neutral-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-700">
          <div className="flex-1">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-bold text-white bg-transparent border-none outline-none w-full"
              placeholder="Titre du document"
            />
          </div>
          <div className="flex gap-2 ml-4">
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Télécharger
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Sauvegarder
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Editor */}
        <div className="flex-1 overflow-hidden p-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full bg-neutral-800 border border-neutral-700 rounded-lg p-4 text-white resize-none focus:outline-none focus:border-blue-500 font-mono"
            placeholder="Contenu du document..."
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-700 flex items-center justify-between text-sm text-gray-400">
          <div className="flex gap-4">
            <span>{content.split(/\s+/).filter(w => w).length} mots</span>
            <span>{content.length} caractères</span>
          </div>
          <div>
            {document && (
              <span>Type: {document.type}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentEditorFromDB;
