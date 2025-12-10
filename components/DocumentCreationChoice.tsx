import React from 'react';
import { FileText, PenTool, X } from 'lucide-react';

interface DocumentCreationChoiceProps {
  onClose: () => void;
  onSelectFromTemplate: () => void;
  onCreateFromScratch: () => void;
}

const DocumentCreationChoice: React.FC<DocumentCreationChoiceProps> = ({
  onClose,
  onSelectFromTemplate,
  onCreateFromScratch
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-lg w-full max-w-2xl border border-neutral-800">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-neutral-800">
          <div>
            <h2 className="text-2xl font-bold text-white">Créer un Document</h2>
            <p className="text-gray-400 text-sm mt-1">Choisissez comment vous souhaitez commencer</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition p-2 hover:bg-neutral-800 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Choices */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Option 1: Depuis un modèle */}
          <button
            onClick={onSelectFromTemplate}
            className="group relative bg-gradient-to-br from-purple-600/10 via-pink-600/10 to-orange-600/10 border-2 border-purple-600/30 rounded-xl p-6 text-left hover:border-purple-500 hover:from-purple-600/20 hover:to-blue-600/20 transition-all duration-300"
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className="p-4 bg-purple-600/20 rounded-full group-hover:bg-purple-600/30 transition">
                <FileText className="w-10 h-10 text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Depuis un Modèle</h3>
                <p className="text-gray-400 text-sm">
                  Choisissez parmi 31 modèles professionnels pré-rédigés
                </p>
                <div className="mt-3 flex flex-wrap gap-2 justify-center">
                  <span className="px-2 py-1 bg-purple-600/20 rounded text-xs text-purple-300">Contrats</span>
                  <span className="px-2 py-1 bg-purple-600/20 rounded text-xs text-purple-300">Lettres</span>
                  <span className="px-2 py-1 bg-purple-600/20 rounded text-xs text-purple-300">Sociétés</span>
                </div>
              </div>
            </div>
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Option 2: De zéro */}
          <button
            onClick={onCreateFromScratch}
            className="group relative bg-gradient-to-br from-blue-600/10 to-cyan-600/10 border-2 border-blue-600/30 rounded-xl p-6 text-left hover:border-blue-500 hover:from-blue-600/20 hover:to-cyan-600/20 transition-all duration-300"
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className="p-4 bg-blue-600/20 rounded-full group-hover:bg-blue-600/30 transition">
                <PenTool className="w-10 h-10 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Document Vierge</h3>
                <p className="text-gray-400 text-sm">
                  Créez un document personnalisé avec l'assistance de l'IA
                </p>
                <div className="mt-3 flex flex-wrap gap-2 justify-center">
                  <span className="px-2 py-1 bg-blue-600/20 rounded text-xs text-blue-300">Personnalisé</span>
                  <span className="px-2 py-1 bg-blue-600/20 rounded text-xs text-blue-300">Flexible</span>
                  <span className="px-2 py-1 bg-blue-600/20 rounded text-xs text-blue-300">Assistance IA</span>
                </div>
              </div>
            </div>
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-800/50 rounded-b-lg border-t border-neutral-800">
          <p className="text-xs text-gray-500 text-center">
            💡 Astuce : Les modèles sont pré-remplis avec des clauses juridiques standards que vous pouvez personnaliser
          </p>
        </div>
      </div>
    </div>
  );
};

export default DocumentCreationChoice;
