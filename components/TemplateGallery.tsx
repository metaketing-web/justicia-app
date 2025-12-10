import React, { useState } from 'react';
import { X, Search, FileText, Mail, FileCheck, Gavel } from 'lucide-react';
import TemplateFormGenerator from './TemplateFormGenerator';

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ReactNode;
  content?: string;
}

interface TemplateGalleryProps {
  onClose: () => void;
  onSelectTemplate: (template: Template) => void;
  onShowVoiceChat?: (templateContext: string) => void;
}

const TemplateGallery: React.FC<TemplateGalleryProps> = ({ onClose, onSelectTemplate, onShowVoiceChat }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // 31 modèles réels BTP fournis par l'utilisateur
  const templates: Template[] = [
    // Gestion de Chantier (1 modèle)
    {
      id: 'journal-chantier',
      name: 'Journal de Chantier',
      category: 'Gestion de Chantier',
      description: 'Modèle de journal de chantier pour suivi quotidien des travaux',
      icon: <FileText className="w-6 h-6" />
    },

    // Courriers et Correspondances (8 modèles)
    {
      id: 'validation-plans',
      name: 'Courrier de Validation de Plans',
      category: 'Courriers',
      description: 'Courrier type pour validation de plans de construction',
      icon: <Mail className="w-6 h-6" />
    },
    {
      id: 'mise-en-demeure-avancement',
      name: 'Mise en Demeure - Avancement des Travaux',
      category: 'Courriers',
      description: 'Modèle de mise en demeure pour retard d\'avancement',
      icon: <Mail className="w-6 h-6" />
    },
    {
      id: 'mise-en-demeure-qualite',
      name: 'Mise en Demeure - Qualité des Travaux',
      category: 'Courriers',
      description: 'Modèle de mise en demeure pour défaut de qualité',
      icon: <Mail className="w-6 h-6" />
    },
    {
      id: 'mise-en-demeure-hse',
      name: 'Mise en Demeure - HSE',
      category: 'Courriers',
      description: 'Modèle de mise en demeure pour non-respect des règles HSE',
      icon: <Mail className="w-6 h-6" />
    },
    {
      id: 'retard-devoiement-reseaux',
      name: 'Retard des Entreprises - Dévoiement de Réseaux',
      category: 'Courriers',
      description: 'Courrier type pour retard de dévoiement de réseaux',
      icon: <Mail className="w-6 h-6" />
    },
    {
      id: 'relance-infos-complementaires',
      name: 'Relance - Demande d\'Informations Complémentaires',
      category: 'Courriers',
      description: 'Courrier de relance pour informations manquantes',
      icon: <Mail className="w-6 h-6" />
    },
    {
      id: 'demande-infos-complementaires',
      name: 'Demande d\'Informations Complémentaires',
      category: 'Courriers',
      description: 'Courrier type pour demande d\'informations',
      icon: <Mail className="w-6 h-6" />
    },
    {
      id: 'deplacement-reseau-dommages',
      name: 'Déplacement de Réseau - Réparation des Dommages',
      category: 'Courriers',
      description: 'Courrier type pour réparation de dommages sur réseaux',
      icon: <Mail className="w-6 h-6" />
    },

    // Réceptions et Paiements (4 modèles)
    {
      id: 'reception-provisoire',
      name: 'Demande de Réception Provisoire des Travaux',
      category: 'Réceptions',
      description: 'Modèle de demande de réception provisoire',
      icon: <FileCheck className="w-6 h-6" />
    },
    {
      id: 'reception-partielle',
      name: 'Réception Partielle Provisoire',
      category: 'Réceptions',
      description: 'Modèle de réception partielle provisoire des travaux',
      icon: <FileCheck className="w-6 h-6" />
    },
    {
      id: 'reception-definitive',
      name: 'Demande de Réception Définitive des Travaux',
      category: 'Réceptions',
      description: 'Modèle de demande de réception définitive',
      icon: <FileCheck className="w-6 h-6" />
    },
    {
      id: 'paiement-retenue-garantie',
      name: 'Demande de Paiement de la Retenue de Garantie',
      category: 'Réceptions',
      description: 'Modèle de demande de mainlevée sur la caution',
      icon: <FileCheck className="w-6 h-6" />
    },

    // Procédures et Demandes (5 modèles)
    {
      id: 'levee-cautionnement',
      name: 'Demande de Levée de Cautionnement Définitif',
      category: 'Procédures',
      description: 'Modèle de demande de levée de cautionnement',
      icon: <Gavel className="w-6 h-6" />
    },
    {
      id: 'prolongation-delais',
      name: 'Demande de Prolongation de Délais',
      category: 'Procédures',
      description: 'Modèle de demande de prolongation de délais',
      icon: <Gavel className="w-6 h-6" />
    },
    {
      id: 'liberation-emprise',
      name: 'Libération de l\'Emprise des Travaux',
      category: 'Procédures',
      description: 'Courrier type pour libération d\'emprise',
      icon: <Gavel className="w-6 h-6" />
    },
    {
      id: 'formalisation-instruction',
      name: 'Formalisation d\'une Instruction Verbale',
      category: 'Procédures',
      description: 'Modèle de formalisation d\'instruction verbale',
      icon: <Gavel className="w-6 h-6" />
    },
    {
      id: 'atteinte-masse-initiale',
      name: 'Atteinte de la Masse Initiale des Travaux',
      category: 'Procédures',
      description: 'Courrier type pour atteinte de la masse initiale',
      icon: <Gavel className="w-6 h-6" />
    },

    // Contrats et Conventions (12 modèles)
    {
      id: 'contrat-transport',
      name: 'Contrat de Transport de Matériaux ou Fournitures',
      category: 'Contrats',
      description: 'Contrat type de transport de matériaux',
      icon: <FileText className="w-6 h-6" />
    },
    {
      id: 'protocole-transactionnel-carriere',
      name: 'Protocole Transactionnel Carrière',
      category: 'Contrats',
      description: 'Modèle de protocole transactionnel pour carrière',
      icon: <FileText className="w-6 h-6" />
    },
    {
      id: 'location-terrain-stockage',
      name: 'Contrat de Location de Terrain pour Stockage',
      category: 'Contrats',
      description: 'Contrat de location de terrain pour stockage de matériaux',
      icon: <FileText className="w-6 h-6" />
    },
    {
      id: 'depot-definitif-materiaux',
      name: 'Contrat de Mise en Dépôt Définitif de Matériaux',
      category: 'Contrats',
      description: 'Modèle de contrat de mise en dépôt définitif',
      icon: <FileText className="w-6 h-6" />
    },
    {
      id: 'emprunt-materiaux-rural',
      name: 'Emprunt de Matériaux en Zone Rurale',
      category: 'Contrats',
      description: 'Contrat d\'emprunt de matériaux en zone rurale',
      icon: <FileText className="w-6 h-6" />
    },
    {
      id: 'mise-disposition-terrain-admin',
      name: 'Mise à Disposition de Terrain Nu par une Administration',
      category: 'Contrats',
      description: 'Modèle de mise à disposition par administration',
      icon: <FileText className="w-6 h-6" />
    },
    {
      id: 'mise-disposition-terrain-village',
      name: 'Mise à Disposition de Terrain Nu par un Village',
      category: 'Contrats',
      description: 'Modèle de mise à disposition par un village',
      icon: <FileText className="w-6 h-6" />
    },
    {
      id: 'mise-disposition-terrain-particulier',
      name: 'Mise à Disposition de Terrain Nu par un Particulier',
      category: 'Contrats',
      description: 'Modèle de mise à disposition par un particulier',
      icon: <FileText className="w-6 h-6" />
    },
    {
      id: 'location-engins',
      name: 'Contrat de Location d\'Engins',
      category: 'Contrats',
      description: 'Contrat type de location d\'engins de chantier',
      icon: <FileText className="w-6 h-6" />
    },
    {
      id: 'fourniture-materiaux',
      name: 'Contrat de Fourniture de Matériaux',
      category: 'Contrats',
      description: 'Modèle de contrat de fourniture de matériaux',
      icon: <FileText className="w-6 h-6" />
    },
    {
      id: 'convention-soins-medicaux',
      name: 'Convention pour les Soins Médicaux',
      category: 'Contrats',
      description: 'Modèle de convention pour soins médicaux',
      icon: <FileText className="w-6 h-6" />
    },
    {
      id: 'conditions-generales-vente',
      name: 'Conditions Générales de Vente',
      category: 'Contrats',
      description: 'Modèle de conditions générales de vente',
      icon: <FileText className="w-6 h-6" />
    },

    // Conditions Générales (1 modèle)
    {
      id: 'conditions-generales-achat',
      name: 'Conditions Générales d\'Achat',
      category: 'Conditions Générales',
      description: 'Modèle de conditions générales d\'achat',
      icon: <FileText className="w-6 h-6" />
    }
  ];

  const categories = ['Tous', 'Gestion de Chantier', 'Courriers', 'Réceptions', 'Procédures', 'Contrats', 'Conditions Générales'];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Tous' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-[10000] bg-black/95 flex items-center justify-center p-4">
      <div className="bg-neutral-900 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl border border-neutral-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <div>
            <h2 className="text-2xl font-bold text-white">Modèles de Documents BTP</h2>
            <p className="text-neutral-400 text-sm mt-1">{templates.length} modèles professionnels disponibles</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-neutral-400" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-neutral-800">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Rechercher un modèle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="px-6 py-4 border-b border-neutral-800 overflow-x-auto">
          <div className="flex gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
              <p className="text-neutral-400 text-lg">Aucun modèle trouvé</p>
              <p className="text-neutral-500 text-sm mt-2">Essayez de modifier votre recherche</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplateId(template.id)}
                  className="group bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 hover:border-purple-500 rounded-xl p-6 text-left transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/20"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 rounded-lg text-white group-hover:scale-110 transition-transform">
                      {template.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm mb-2 group-hover:text-purple-400 transition-colors line-clamp-2">
                        {template.name}
                      </h3>
                      <p className="text-neutral-400 text-xs line-clamp-2 mb-3">
                        {template.description}
                      </p>
                      <span className="inline-block px-3 py-1 bg-neutral-700 text-neutral-300 text-xs rounded-full">
                        {template.category}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-800 bg-neutral-900/50">
          <div className="flex items-center justify-between text-sm">
            <p className="text-neutral-400">
              💡 Astuce : Les modèles sont pré-remplis avec des clauses juridiques standards BTP
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
      
      {/* Formulaire de génération */}
      {selectedTemplateId && (
        <TemplateFormGenerator
          templateId={selectedTemplateId}
          onClose={() => setSelectedTemplateId(null)}
          onGenerate={(content) => {
            const template = templates.find(t => t.id === selectedTemplateId);
            if (template) {
              onSelectTemplate({ ...template, content } as any);
            }
            setSelectedTemplateId(null);
            onClose();
          }}
          onShowVoiceChat={onShowVoiceChat ? (templateContext) => {
            onShowVoiceChat(templateContext);
          } : undefined}
        />
      )}
    </div>
  );
};

export default TemplateGallery;
