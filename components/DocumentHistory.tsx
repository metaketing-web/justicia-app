import React, { useState, useEffect } from 'react';
import { FileText, Download, Trash2, Search, Filter, Calendar, Mic, MessageSquare, FileCheck, X, Plus, Edit } from 'lucide-react';
import { 
  getDocumentHistory, 
  removeDocumentFromHistory, 
  searchDocumentHistory,
  filterDocumentHistoryByType,
  DocumentHistoryItem 
} from '../services/documentHistory.service';

interface DocumentHistoryProps {
  onClose: () => void;
  onCreateBlank: () => void;
  onSelectTemplate: () => void;
}

const DocumentHistory: React.FC<DocumentHistoryProps> = ({ onClose, onCreateBlank, onSelectTemplate }) => {
  const [documents, setDocuments] = useState<DocumentHistoryItem[]>([]);
  const [filteredDocs, setFilteredDocs] = useState<DocumentHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<DocumentHistoryItem['type'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [documents, searchQuery, selectedType, sortBy]);

  const loadDocuments = () => {
    const history = getDocumentHistory();
    setDocuments(history);
  };

  const applyFilters = () => {
    let filtered = [...documents];

    // Filtre par type
    if (selectedType !== 'all') {
      filtered = filtered.filter(doc => doc.type === selectedType);
    }

    // Recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(query) ||
        doc.description?.toLowerCase().includes(query) ||
        doc.fileName?.toLowerCase().includes(query)
      );
    }

    // Tri
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return b.createdAt.getTime() - a.createdAt.getTime();
      } else {
        return a.title.localeCompare(b.title);
      }
    });

    setFilteredDocs(filtered);
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      removeDocumentFromHistory(id);
      loadDocuments();
    }
  };

  const handleDownload = (doc: DocumentHistoryItem) => {
    if (doc.fileUrl) {
      const a = document.createElement('a');
      a.href = doc.fileUrl;
      a.download = doc.fileName || 'document.docx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const getTypeIcon = (type: DocumentHistoryItem['type']) => {
    switch (type) {
      case 'template':
        return <FileText className="w-5 h-5 text-blue-400" />;
      case 'chat_synthesis':
        return <MessageSquare className="w-5 h-5 text-green-400" />;
      case 'analysis_report':
        return <FileCheck className="w-5 h-5 text-purple-400" />;
      case 'audio_recording':
        return <Mic className="w-5 h-5 text-orange-400" />;
    }
  };

  const getTypeLabel = (type: DocumentHistoryItem['type']) => {
    switch (type) {
      case 'template':
        return 'Document généré';
      case 'chat_synthesis':
        return 'Synthèse de chat';
      case 'analysis_report':
        return 'Rapport d\'analyse';
      case 'audio_recording':
        return 'Enregistrement audio';
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return `Il y a ${minutes} min`;
      }
      return `Il y a ${hours}h`;
    } else if (days === 1) {
      return 'Hier';
    } else if (days < 7) {
      return `Il y a ${days} jours`;
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col border border-neutral-700">
        {/* Header */}
        <div className="p-6 border-b border-neutral-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <FileText className="w-7 h-7 text-purple-400" />
              Mes Documents
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Actions rapides */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={onCreateBlank}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 hover:from-purple-700 hover:via-pink-600 hover:to-orange-600 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Document Vierge
            </button>
            <button
              onClick={onSelectTemplate}
              className="flex-1 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5" />
              Depuis un Modèle
            </button>
          </div>

          {/* Barre de recherche */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un document..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Filtres */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedType === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-neutral-800 text-gray-300 hover:bg-neutral-700'
              }`}
            >
              Tous ({documents.length})
            </button>
            <button
              onClick={() => setSelectedType('template')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                selectedType === 'template'
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-800 text-gray-300 hover:bg-neutral-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              Documents ({documents.filter(d => d.type === 'template').length})
            </button>
            <button
              onClick={() => setSelectedType('chat_synthesis')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                selectedType === 'chat_synthesis'
                  ? 'bg-green-600 text-white'
                  : 'bg-neutral-800 text-gray-300 hover:bg-neutral-700'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Chats ({documents.filter(d => d.type === 'chat_synthesis').length})
            </button>
            <button
              onClick={() => setSelectedType('analysis_report')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                selectedType === 'analysis_report'
                  ? 'bg-purple-600 text-white'
                  : 'bg-neutral-800 text-gray-300 hover:bg-neutral-700'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              Analyses ({documents.filter(d => d.type === 'analysis_report').length})
            </button>
            <button
              onClick={() => setSelectedType('audio_recording')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                selectedType === 'audio_recording'
                  ? 'bg-orange-600 text-white'
                  : 'bg-neutral-800 text-gray-300 hover:bg-neutral-700'
              }`}
            >
              <Mic className="w-4 h-4" />
              Audio ({documents.filter(d => d.type === 'audio_recording').length})
            </button>
          </div>
        </div>

        {/* Liste des documents */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredDocs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">
                {searchQuery || selectedType !== 'all' 
                  ? 'Aucun document trouvé'
                  : 'Aucun document pour le moment'}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                {searchQuery || selectedType !== 'all'
                  ? 'Essayez une autre recherche ou filtre'
                  : 'Créez votre premier document !'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocs.map(doc => (
                <div
                  key={doc.id}
                  className="bg-neutral-800 border border-neutral-700 rounded-xl p-4 hover:border-purple-500 transition-all hover:shadow-lg hover:shadow-purple-500/20"
                >
                  <div className="flex items-start justify-between mb-3">
                    {getTypeIcon(doc.type)}
                    <div className="flex gap-1">
                      {doc.fileUrl && (
                        <button
                          onClick={() => handleDownload(doc)}
                          className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded transition-colors"
                          title="Télécharger"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-white font-medium mb-1 line-clamp-2">
                    {doc.title}
                  </h3>

                  {doc.description && (
                    <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                      {doc.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-3 border-t border-neutral-700">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(doc.createdAt)}
                    </span>
                    {doc.fileSize && (
                      <span>{formatFileSize(doc.fileSize)}</span>
                    )}
                  </div>

                  <div className="mt-2">
                    <span className="text-xs px-2 py-1 bg-neutral-700 text-gray-300 rounded">
                      {getTypeLabel(doc.type)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-700 bg-neutral-900/50">
          <p className="text-gray-400 text-sm text-center">
            💾 {documents.length} document{documents.length > 1 ? 's' : ''} sauvegardé{documents.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DocumentHistory;
