import React, { useState } from 'react';
import { FileText, Search, ChevronRight } from 'lucide-react';
import { DOCUMENT_TEMPLATES, DOCUMENT_CATEGORIES, DocumentTemplate } from '../config/documentTemplates';

interface DocumentTemplateSelectorProps {
  onSelectTemplate: (template: DocumentTemplate) => void;
  onClose: () => void;
}

const DocumentTemplateSelector: React.FC<DocumentTemplateSelectorProps> = ({ onSelectTemplate, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filtrer les templates
  const filteredTemplates = DOCUMENT_TEMPLATES.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Grouper par catégorie
  const templatesByCategory = DOCUMENT_CATEGORIES.map(category => ({
    ...category,
    templates: filteredTemplates.filter(t => t.category === category.id)
  })).filter(cat => cat.templates.length > 0);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-neutral-700">
        {/* Header */}
        <div className="p-6 border-b border-neutral-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <FileText className="w-7 h-7 text-purple-400" />
              Choisir un Modèle de Document
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un modèle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Filtres par catégorie */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !selectedCategory
                  ? 'bg-purple-600 text-white'
                  : 'bg-neutral-800 text-gray-300 hover:bg-neutral-700'
              }`}
            >
              Tous
            </button>
            {DOCUMENT_CATEGORIES.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  selectedCategory === category.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-neutral-800 text-gray-300 hover:bg-neutral-700'
                }`}
              >
                <span>{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Liste des templates */}
        <div className="flex-1 overflow-y-auto p-6">
          {templatesByCategory.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Aucun modèle trouvé</p>
              <p className="text-gray-500 text-sm mt-2">Essayez une autre recherche</p>
            </div>
          ) : (
            <div className="space-y-8">
              {templatesByCategory.map(category => (
                <div key={category.id}>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">{category.icon}</span>
                    {category.name}
                    <span className="text-sm text-gray-400 font-normal">({category.templates.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {category.templates.map(template => (
                      <button
                        key={template.id}
                        onClick={() => onSelectTemplate(template)}
                        className="group bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 hover:border-purple-500 rounded-xl p-4 text-left transition-all hover:shadow-lg hover:shadow-purple-500/20"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <FileText className="w-5 h-5 text-purple-400 flex-shrink-0" />
                          <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-purple-400 transition-colors" />
                        </div>
                        <h4 className="text-white font-medium mb-1 group-hover:text-purple-300 transition-colors">
                          {template.name}
                        </h4>
                        <p className="text-gray-400 text-sm line-clamp-2">
                          {template.description}
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {template.fields.length} champ{template.fields.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-700 bg-neutral-900/50">
          <p className="text-gray-400 text-sm text-center">
            💡 Sélectionnez un modèle pour le remplir via formulaire, IA ou commande vocale
          </p>
        </div>
      </div>
    </div>
  );
};

export default DocumentTemplateSelector;
