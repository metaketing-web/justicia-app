import React, { useState, useEffect } from 'react';
import { X, FileText, Trash2, Download, Edit, Share2, Search, Filter, Loader2 } from 'lucide-react';
import { trpc } from '../lib/trpc';
import { generateWordDocument } from '../services/wordDocumentService';

interface DocumentsListNewProps {
  onClose: () => void;
  onOpenDocument?: (documentId: number) => void;
}

const DocumentsListNew: React.FC<DocumentsListNewProps> = ({ onClose, onOpenDocument }) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'imported' | 'created' | 'template'>('all');

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, [typeFilter]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const docs = await trpc.documents.list.query({
        limit: 100,
        offset: 0,
        type: typeFilter === 'all' ? undefined : typeFilter,
      });
      setDocuments(docs);
    } catch (error) {
      console.error('[DocumentsList] Error loading documents:', error);
      alert('Erreur lors du chargement des documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc: any) => {
    try {
      // Get download URL from backend
      const { url } = await trpc.documents.getDownloadUrl.query({ id: doc.id });
      
      // Fetch content
      const response = await fetch(url);
      const content = await response.text();

      // Generate Word document
      const blob = await generateWordDocument({
        title: doc.title,
        content,
        headerType: doc.type === 'created' || doc.type === 'template' ? 'porteo' : 'justicia',
      });

      // Download
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${doc.title.replace(/[^a-z0-9]/gi, '_')}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('[DocumentsList] Error downloading:', error);
      alert('Erreur lors du téléchargement du document');
    }
  };

  const handleDelete = async (doc: any) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${doc.title}" ?`)) return;

    try {
      await trpc.documents.delete.mutate({ id: doc.id });
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
    } catch (error) {
      console.error('[DocumentsList] Error deleting:', error);
      alert('Erreur lors de la suppression du document');
    }
  };

  const handleEdit = (doc: any) => {
    if (onOpenDocument) {
      onOpenDocument(doc.id);
    } else {
      alert('Fonction d\'édition non disponible dans ce contexte');
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      imported: 'Importé',
      created: 'Créé',
      template: 'Modèle',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      imported: 'bg-blue-500/20 text-blue-400',
      created: 'bg-green-500/20 text-green-400',
      template: 'bg-purple-500/20 text-purple-400',
    };
    return colors[type] || 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col border border-neutral-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-700">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">
              Mes Documents
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

        {/* Filters */}
        <div className="p-6 border-b border-neutral-700 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un document..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Type filter */}
          <div className="flex gap-2">
            <Filter className="w-5 h-5 text-gray-400 mt-2" />
            <div className="flex gap-2 flex-wrap">
              {['all', 'imported', 'created', 'template'].map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type as any)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    typeFilter === type
                      ? 'bg-blue-500 text-white'
                      : 'bg-neutral-800 text-gray-400 hover:bg-neutral-700'
                  }`}
                >
                  {type === 'all' ? 'Tous' : getTypeLabel(type)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">
                {searchTerm ? 'Aucun document trouvé' : 'Aucun document enregistré'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-neutral-800 rounded-lg p-4 border border-neutral-700 hover:border-neutral-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {doc.title}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(doc.type)}`}>
                          {getTypeLabel(doc.type)}
                        </span>
                      </div>
                      {doc.description && (
                        <p className="text-gray-400 text-sm mb-2">{doc.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Créé le {formatDate(doc.createdAt)}</span>
                        {doc.fileSize && (
                          <span>{Math.round(doc.fileSize / 1024)} KB</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(doc)}
                        className="p-2 hover:bg-neutral-700 rounded-lg transition-colors group"
                        title="Modifier"
                      >
                        <Edit className="w-5 h-5 text-gray-400 group-hover:text-blue-400" />
                      </button>
                      <button
                        onClick={() => handleDownload(doc)}
                        className="p-2 hover:bg-neutral-700 rounded-lg transition-colors group"
                        title="Télécharger"
                      >
                        <Download className="w-5 h-5 text-gray-400 group-hover:text-green-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc)}
                        className="p-2 hover:bg-neutral-700 rounded-lg transition-colors group"
                        title="Supprimer"
                      >
                        <Trash2 className="w-5 h-5 text-gray-400 group-hover:text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentsListNew;
