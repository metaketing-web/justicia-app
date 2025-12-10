import React, { useState, useEffect } from 'react';
import { X, FileText, Download, AlertCircle } from 'lucide-react';

interface TemplateField {
    type: string;
    pattern: string;
    label: string;
    required: boolean;
    help?: string;
}

interface Template {
    id: string;
    name: string;
    filename: string;
    type: string;
    content_prefilled: string;
    fields: TemplateField[];
    porteo_info: {
        nom_societe: string;
        forme_juridique: string;
        capital_social: string;
        siege_social: string;
        telephone: string;
        rccm: string;
        representant: string;
        qualite_representant: string;
    };
}

interface TemplateFormGeneratorProps {
    templateId: string;
    onClose: () => void;
    onGenerate: (content: string) => void;
    onShowVoiceChat?: (templateContext: string) => void;
}

const TemplateFormGenerator: React.FC<TemplateFormGeneratorProps> = ({
    templateId,
    onClose,
    onGenerate,
    onShowVoiceChat
}) => {
    const [template, setTemplate] = useState<Template | null>(null);
    const [fieldValues, setFieldValues] = useState<{ [key: string]: string }>({});
    const [aiInstructions, setAiInstructions] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadTemplate();
    }, [templateId]);

    const loadTemplate = async () => {
        try {
            setLoading(true);
            const response = await fetch('/data/templates_prefilled.json');
            const templates: Template[] = await response.json();
            const selectedTemplate = templates.find(t => t.id === templateId);
            
            if (selectedTemplate) {
                setTemplate(selectedTemplate);
                // Initialiser les valeurs des champs
                const initialValues: { [key: string]: string } = {};
                selectedTemplate.fields.forEach((field, index) => {
                    initialValues[`field_${index}`] = '';
                });
                setFieldValues(initialValues);
            } else {
                setError('Modèle non trouvé');
            }
        } catch (err) {
            setError('Erreur de chargement du modèle');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFieldChange = (fieldKey: string, value: string) => {
        setFieldValues(prev => ({
            ...prev,
            [fieldKey]: value
        }));
    };

    const handleGenerate = () => {
        if (!template) return;

        setGenerating(true);

        try {
            let generatedContent = template.content_prefilled;

            // Remplacer les champs variables par les valeurs saisies (séquentiellement)
            template.fields.forEach((field, index) => {
                const fieldKey = `field_${index}`;
                const value = fieldValues[fieldKey] || field.pattern;
                // Remplacer seulement la PREMIÈRE occurrence pour éviter les répétitions
                generatedContent = generatedContent.replace(field.pattern, value);
            });

            // Ajouter les instructions IA si présentes
            if (aiInstructions.trim()) {
                generatedContent += `\n\n---\n\n**Instructions IA** :\n${aiInstructions}`;
            }

            onGenerate(generatedContent);
        } catch (err) {
            setError('Erreur lors de la génération du document');
            console.error(err);
        } finally {
            setGenerating(false);
        }
    };

    const canGenerate = () => {
        if (!template) return false;
        
        // Vérifier que tous les champs requis sont remplis
        return template.fields.every((field, index) => {
            if (field.required) {
                const fieldKey = `field_${index}`;
                return fieldValues[fieldKey] && fieldValues[fieldKey].trim() !== '';
            }
            return true;
        });
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                <div className="bg-neutral-900 rounded-xl p-8 max-w-md w-full mx-4">
                    <div className="flex items-center justify-center gap-3">
                        <div className="w-6 h-6 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-300">Chargement du modèle...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !template) {
        return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                <div className="bg-neutral-900 rounded-xl p-8 max-w-md w-full mx-4">
                    <div className="flex items-center gap-3 text-red-400 mb-4">
                        <AlertCircle className="w-6 h-6" />
                        <p className="font-semibold">Erreur</p>
                    </div>
                    <p className="text-gray-300 mb-6">{error || 'Modèle non trouvé'}</p>
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-neutral-900 rounded-xl max-w-4xl w-full my-8 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutral-800">
                    <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-purple-400" />
                        <div>
                            <h2 className="text-xl font-bold text-white">{template.name}</h2>
                            <p className="text-sm text-gray-400">Remplissez les champs variables</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-neutral-800 rounded-lg transition"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Informations PORTEO BTP pré-remplies */}
                <div className="p-6 bg-purple-900/10 border-b border-neutral-800">
                    <h3 className="text-sm font-semibold text-purple-400 mb-3">✅ Informations pré-remplies (PORTEO BTP)</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-500">Société :</span>
                            <span className="text-gray-300 ml-2">{template.porteo_info.nom_societe}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">Forme juridique :</span>
                            <span className="text-gray-300 ml-2">{template.porteo_info.forme_juridique}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">Capital social :</span>
                            <span className="text-gray-300 ml-2">{template.porteo_info.capital_social}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">RCCM :</span>
                            <span className="text-gray-300 ml-2">{template.porteo_info.rccm}</span>
                        </div>
                        <div className="col-span-2">
                            <span className="text-gray-500">Représentant :</span>
                            <span className="text-gray-300 ml-2">
                                {template.porteo_info.representant} ({template.porteo_info.qualite_representant})
                            </span>
                        </div>
                    </div>
                </div>

                {/* Formulaire de champs variables */}
                <div className="p-6 max-h-96 overflow-y-auto">
                    {template.fields.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-400">Aucun champ à remplir - Document prêt à générer</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-300 mb-4">
                                    📝 Champs à compléter ({template.fields.length})
                                </h3>
                                <div className="space-y-4">
                                {template.fields.map((field, index) => (
                                    <div key={index} className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-300">
                                            {field.label} {field.required && <span className="text-red-400">*</span>}
                                            <span className="text-xs text-gray-500 ml-2">({field.pattern})</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={fieldValues[`field_${index}`]}
                                            onChange={(e) => handleFieldChange(`field_${index}`, e.target.value)}
                                            placeholder={`Remplacer ${field.pattern}`}
                                            className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                                            required={field.required}
                                        />
                                        {field.help && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                💡 {field.help}
                                            </p>
                                        )}
                                    </div>
                                ))}
                                </div>
                            </div>

                            {/* Zone Instructions IA */}
                            <div className="border-t border-neutral-800 pt-6">
                                <h3 className="text-sm font-semibold text-gray-300 mb-2">
                                    🤖 Instructions IA (optionnel)
                                </h3>
                                <p className="text-xs text-gray-500 mb-3">
                                    Demandez à l'IA de modifier, ajouter ou adapter des sections du document.
                                </p>
                                <textarea
                                    value={aiInstructions}
                                    onChange={(e) => setAiInstructions(e.target.value)}
                                    placeholder="Exemple : Modifie l'article 12 pour ajouter une clause de révision des prix tous les 6 mois"
                                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-purple-500 transition resize-none"
                                    rows={4}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-neutral-800">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                    >
                        Annuler
                    </button>
                    {onShowVoiceChat && template && (
                        <button
                            onClick={() => {
                                const context = `Modèle: ${template.name}\n\nChamps à remplir:\n${template.fields.map(f => `- ${f.label}${f.required ? ' (requis)' : ''}`).join('\n')}\n\nValeurs actuelles:\n${Object.entries(fieldValues).map(([k, v]) => `${k}: ${v || '(vide)'}`).join('\n')}`;
                                onShowVoiceChat(context);
                            }}
                            className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                            title="Remplir vocalement"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                            Vocal
                        </button>
                    )}
                    <button
                        onClick={handleGenerate}
                        disabled={!canGenerate() || generating}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg transition ${
                            canGenerate() && !generating
                                ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-500 hover:via-pink-500 hover:to-orange-500 text-white'
                                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        {generating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Génération...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
                                Générer le Document
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TemplateFormGenerator;
