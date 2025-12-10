import React, { useState } from 'react';
import { X, FileText, Trash2, Download, Edit } from 'lucide-react';

interface Document {
  id: string;
  title: string;
  content: string;
  annotations: any[];
  createdAt: string;
  updatedAt: string;
}

interface DocumentsListProps {
  documents: Document[];
  onClose: () => void;
  onOpenDocument: (doc: Document) => void;
  onDeleteDocument: (id: string) => void;
}

const DocumentsList: React.FC<DocumentsListProps> = ({
  documents,
  onClose,
  onOpenDocument,
  onDeleteDocument
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownload = async (doc: Document) => {
    try {
      if (!doc.content || doc.content.trim() === '') {
        alert('Le document est vide et ne peut pas être téléchargé');
        return;
      }
      
      console.log('[Download] Téléchargement de:', doc.title, 'Taille:', doc.content.length);
      
      // Utiliser l'endpoint /api/word pour générer un document Word avec en-tête PORTEO
      const response = await fetch('/api/word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: doc.content })
      });
      
      if (!response.ok) throw new Error('Erreur lors de la génération');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${doc.title.replace(/[^a-z0-9]/gi, '_')}_porteo.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la génération du document Word');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-neutral-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-700">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">
              Documents Sauvegardés
            </h2>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
              {documents.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-neutral-700">
          <input
            type="text"
            placeholder="Rechercher un document..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Documents List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">
                {searchTerm ? 'Aucun document trouvé' : 'Aucun document sauvegardé'}
              </p>
            </div>
          ) : (
            filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 hover:border-blue-500/50 transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium text-lg truncate mb-2">
                      {doc.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>Créé le {formatDate(doc.createdAt)}</span>
                      <span>•</span>
                      <span>{doc.content.length} caractères</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onOpenDocument(doc)}
                      className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                      title="Ouvrir"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                      title="Télécharger"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
                          onDeleteDocument(doc.id);
                        }
                      }}
                      className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentsList;
