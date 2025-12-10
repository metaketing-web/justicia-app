import React, { useState, useEffect } from 'react';
import { Database, Trash2, FileText, Calendar, BarChart3, RefreshCw, X } from 'lucide-react';
import { enhancedRAGService, RAGDocument } from '../services/ragService.enhanced';

interface KnowledgeBaseManagerProps {
  onClose: () => void;
}

const KnowledgeBaseManager: React.FC<KnowledgeBaseManagerProps> = ({ onClose }) => {
  const [documents, setDocuments] = useState<RAGDocument[]>([]);
  const [stats, setStats] = useState<{
    documentCount: number;
    embeddingCount: number;
    totalChunks: number;
    cacheSize: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<RAGDocument | null>(null);

  // Charger les documents et statistiques
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [docs, statistics] = await Promise.all([
        enhancedRAGService.getAllDocuments(),
        enhancedRAGService.getStats()
      ]);
      setDocuments(docs);
      setStats(statistics);
    } catch (error) {
      console.error('[KnowledgeBase] Erreur lors du chargement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Supprimer un document
  const handleDeleteDocument = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document de la base de connaissances ?')) {
      return;
    }

    try {
      await enhancedRAGService.removeDocument(id);
      await loadData();
    } catch (error) {
      console.error('[KnowledgeBase] Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du document');
    }
  };

  // Vider toute la base
  const handleClearAll = async () => {
    if (!confirm('⚠️ ATTENTION : Voulez-vous vraiment supprimer TOUS les documents de la base de connaissances ? Cette action est irréversible.')) {
      return;
    }

    try {
      await enhancedRAGService.clearAll();
      await loadData();
    } catch (error) {
      console.error('[KnowledgeBase] Erreur lors du vidage:', error);
      alert('Erreur lors du vidage de la base de connaissances');
    }
  };

  // Formater la date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Formater la taille
  const formatSize = (chars: number) => {
    if (chars < 1000) return `${chars} caractères`;
    if (chars < 1000000) return `${(chars / 1000).toFixed(1)}k caractères`;
    return `${(chars / 1000000).toFixed(1)}M caractères`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999] p-4 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-neutral-700 flex items-center justify-between bg-gradient-to-r from-neutral-900 to-neutral-800">
          <div className="flex items-center gap-3">
            <Database className="w-8 h-8 text-cyan-400" />
            <div>
              <h2 className="text-2xl font-bold text-white">Base de Connaissances</h2>
              <p className="text-sm text-gray-400">Gestion des documents indexés</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Statistiques */}
        {stats && (
          <div className="p-6 bg-neutral-800/50 border-b border-neutral-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-gray-400">Documents</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats.documentCount}</p>
              </div>
              <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-gray-400">Chunks</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats.totalChunks}</p>
              </div>
              <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-5 h-5 text-purple-400" />
                  <span className="text-sm text-gray-400">Embeddings</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats.embeddingCount}</p>
              </div>
              <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm text-gray-400">Cache</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats.cacheSize}</p>
              </div>
            </div>
          </div>
        )}

        {/* Liste des documents */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <Database className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Aucun document dans la base de connaissances</p>
              <p className="text-gray-500 text-sm mt-2">Uploadez des documents pour les ajouter automatiquement</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 hover:border-cyan-500/50 transition-all cursor-pointer"
                  onClick={() => setSelectedDocument(doc)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-cyan-400" />
                        <h3 className="font-semibold text-white">{doc.name}</h3>
                        <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">
                          {doc.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(doc.uploadDate)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BarChart3 className="w-4 h-4" />
                          <span>{doc.chunks.length} chunks</span>
                        </div>
                        {doc.metadata?.charCount && (
                          <div className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            <span>{formatSize(doc.metadata.charCount)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleDeleteDocument(doc.id);
                      }}
                      className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-700 bg-neutral-800/50 flex items-center justify-between">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
          {documents.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Tout supprimer
            </button>
          )}
        </div>
      </div>

      {/* Modal de détails du document */}
      {selectedDocument && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[99999] p-4"
          onClick={() => setSelectedDocument(null)}
        >
          <div
            className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-neutral-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">{selectedDocument.name}</h3>
              <button
                onClick={() => setSelectedDocument(null)}
                className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">Métadonnées</h4>
                  <div className="bg-neutral-800 p-4 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type:</span>
                      <span className="text-white">{selectedDocument.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Date d'upload:</span>
                      <span className="text-white">{formatDate(selectedDocument.uploadDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Nombre de chunks:</span>
                      <span className="text-white">{selectedDocument.chunks.length}</span>
                    </div>
                    {selectedDocument.metadata?.wordCount && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Mots:</span>
                        <span className="text-white">{selectedDocument.metadata.wordCount}</span>
                      </div>
                    )}
                    {selectedDocument.metadata?.charCount && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Caractères:</span>
                        <span className="text-white">{selectedDocument.metadata.charCount}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">Aperçu du contenu</h4>
                  <div className="bg-neutral-800 p-4 rounded-lg text-sm text-gray-300 max-h-64 overflow-y-auto">
                    {selectedDocument.content.substring(0, 1000)}
                    {selectedDocument.content.length > 1000 && '...'}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">Chunks ({selectedDocument.chunks.length})</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedDocument.chunks.slice(0, 5).map((chunk, index) => (
                      <div key={index} className="bg-neutral-800 p-3 rounded-lg text-sm text-gray-300">
                        <span className="text-cyan-400 font-semibold">Chunk {index + 1}:</span> {chunk.substring(0, 150)}
                        {chunk.length > 150 && '...'}
                      </div>
                    ))}
                    {selectedDocument.chunks.length > 5 && (
                      <p className="text-gray-500 text-sm text-center">
                        ... et {selectedDocument.chunks.length - 5} autres chunks
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBaseManager;

