import React, { useState } from 'react';
import { DocumentTemplate, TemplateField } from '../data/templates';
import { X, Sparkles, Download, FileText, Wand2, Loader2 } from 'lucide-react';
import { generateDocumentFromTemplate } from '../services/template-generator.service';

interface TemplateFormProps {
    template: DocumentTemplate;
    onClose: () => void;
}

const TemplateForm: React.FC<TemplateFormProps> = ({ template, onClose }) => {
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState<string>('');
    const [showAIAssistant, setShowAIAssistant] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isAIProcessing, setIsAIProcessing] = useState(false);

    const handleFieldChange = (fieldName: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [fieldName]: value
        }));
    };

    const handleAIAssist = async () => {
        if (!aiPrompt.trim()) return;

        setIsAIProcessing(true);
        try {
            // Import du service de remplissage automatique
            const { fillTemplateFieldsWithAI } = await import('../services/template-generator.service');
            
            const aiData = await fillTemplateFieldsWithAI(template.id, template.fields, aiPrompt);
            setFormData(aiData);
            setShowAIAssistant(false);
            setAiPrompt('');
        } catch (error) {
            console.error('Erreur IA:', error);
            alert('Impossible de remplir automatiquement les champs. Veuillez les remplir manuellement.');
        } finally {
            setIsAIProcessing(false);
        }
    };

    const handleGenerate = async () => {
        // Vérifier les champs requis
        const missingFields = template.fields
            .filter(field => field.required && !formData[field.name])
            .map(field => field.label);

        if (missingFields.length > 0) {
            alert(`Veuillez remplir les champs obligatoires: ${missingFields.join(', ')}`);
            return;
        }

        setIsGenerating(true);
        try {
            const content = await generateDocumentFromTemplate(template, formData);
            setGeneratedContent(content);
        } catch (error) {
            console.error('Erreur de génération:', error);
            alert('Erreur lors de la génération du document');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadTxt = () => {
        const { exportToTxt } = require('../services/document-export.service');
        exportToTxt(generatedContent, `${template.filename.replace(/\.(docx|xlsx)$/, '')}_genere`);
    };

    const handleDownloadDocx = async () => {
        try {
            const { exportToDocx } = await import('../services/document-export.service');
            await exportToDocx(generatedContent, `${template.filename.replace(/\.(docx|xlsx)$/, '')}_genere`);
        } catch (error) {
            console.error('Erreur export DOCX:', error);
            alert('Erreur lors de l\'export DOCX');
        }
    };

    const handleDownloadPdf = async () => {
        try {
            const { exportToPdf } = await import('../services/document-export.service');
            await exportToPdf(generatedContent, `${template.filename.replace(/\.(docx|xlsx)$/, '')}_genere`);
        } catch (error) {
            console.error('Erreur export PDF:', error);
            alert('Erreur lors de l\'export PDF');
        }
    };

    const renderField = (field: TemplateField) => {
        const commonClasses = "w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500";

        switch (field.type) {
            case 'textarea':
                return (
                    <textarea
                        value={formData[field.name] || ''}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        placeholder={field.placeholder || field.label}
                        rows={4}
                        className={commonClasses}
                    />
                );

            case 'select':
                return (
                    <select
                        value={formData[field.name] || ''}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        className={commonClasses}
                    >
                        <option value="">Sélectionner...</option>
                        {field.options?.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                );

            case 'date':
                return (
                    <input
                        type="date"
                        value={formData[field.name] || ''}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        className={commonClasses}
                    />
                );

            case 'number':
                return (
                    <input
                        type="number"
                        value={formData[field.name] || ''}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        placeholder={field.placeholder || field.label}
                        className={commonClasses}
                    />
                );

            default:
                return (
                    <input
                        type="text"
                        value={formData[field.name] || ''}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        placeholder={field.placeholder || field.label}
                        className={commonClasses}
                    />
                );
        }
    };

    if (generatedContent) {
        return (
            <div className="flex flex-col h-full bg-black text-white">
                {/* En-tête */}
                <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-green-500" />
                        <div>
                            <h2 className="text-xl font-bold">Document Généré</h2>
                            <p className="text-sm text-gray-400">{template.title}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDownloadDocx}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                        >
                            <Download className="w-5 h-5" />
                            DOCX
                        </button>
                        <button
                            onClick={handleDownloadPdf}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                        >
                            <Download className="w-5 h-5" />
                            PDF
                        </button>
                        <button
                            onClick={handleDownloadTxt}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                        >
                            <Download className="w-5 h-5" />
                            TXT
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-neutral-800 rounded-lg transition ml-auto"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Contenu généré */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
                        <pre className="whitespace-pre-wrap text-sm text-gray-300 font-mono">
                            {generatedContent}
                        </pre>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-neutral-800 flex gap-3">
                    <button
                        onClick={() => setGeneratedContent('')}
                        className="flex-1 px-4 py-3 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition"
                    >
                        Modifier
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                    >
                        Nouveau Document
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-black text-white">
            {/* En-tête */}
            <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-orange-500" />
                    <div>
                        <h2 className="text-xl font-bold">{template.title}</h2>
                        <p className="text-sm text-gray-400">{template.description}</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-neutral-800 rounded-lg transition"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Assistant IA */}
            <div className="p-6 border-b border-neutral-800 bg-gradient-to-r from-orange-500/10 to-purple-500/10">
                {!showAIAssistant ? (
                    <button
                        onClick={() => setShowAIAssistant(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition"
                    >
                        <Wand2 className="w-5 h-5" />
                        <span className="font-semibold">Remplir avec l'Assistant IA</span>
                    </button>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-orange-500 mb-2">
                            <Sparkles className="w-5 h-5" />
                            <span className="font-semibold">Assistant IA</span>
                        </div>
                        <textarea
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder="Décrivez votre besoin et l'IA remplira automatiquement les champs...&#10;&#10;Exemple: 'Je veux créer une mise en demeure pour l'entreprise ABC qui a 15 jours de retard sur le projet XYZ. Le contrat est le C-2024-001.'"
                            rows={4}
                            className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleAIAssist}
                                disabled={isAIProcessing || !aiPrompt.trim()}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isAIProcessing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Génération...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        <span>Générer</span>
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    setShowAIAssistant(false);
                                    setAiPrompt('');
                                }}
                                className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition"
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Formulaire */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-5">
                    {template.fields.map(field => (
                        <div key={field.name}>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                {field.label}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            {renderField(field)}
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-neutral-800 flex gap-3">
                <button
                    onClick={onClose}
                    className="px-6 py-3 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition"
                >
                    Annuler
                </button>
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Génération en cours...</span>
                        </>
                    ) : (
                        <>
                            <FileText className="w-5 h-5" />
                            <span>Générer le Document</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default TemplateForm;
