import React, { useState, useRef } from 'react';
import { AnalysisResult } from '../types';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun, Header } from 'docx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';

interface DocumentEditorProps {
    results: AnalysisResult;
    documentContent: string;
    onClose: () => void;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({ results, onClose }) => {
    const [editorContent, setEditorContent] = useState('');
    const [documentType, setDocumentType] = useState('contrat');
    const [isGenerating, setIsGenerating] = useState(false);
    const [exportFormat, setExportFormat] = useState<'word' | 'pdf'>('word');
    const [aiPrompt, setAiPrompt] = useState('');
    const [isProcessingAI, setIsProcessingAI] = useState(false);
    const editorRef = useRef<HTMLDivElement>(null);
    const promptInputRef = useRef<HTMLTextAreaElement>(null);

    const documentTypes = [
        { value: 'contrat', label: 'Contrat' },
        { value: 'accord', label: 'Accord' },
        { value: 'politique', label: 'Politique' },
        { value: 'conditions', label: 'Conditions d\'utilisation' },
        { value: 'nda', label: 'Accord de confidentialité' },
        { value: 'autre', label: 'Autre document' },
    ];

    const generateTemplate = async () => {
        setIsGenerating(true);
        try {
            // Créer un template basé sur l'analyse
            let template = `${documentTypes.find(t => t.value === documentType)?.label || 'Document'}\n\n`;
            template += `Date de création : ${new Date().toLocaleDateString('fr-FR')}\n\n`;
            
            template += `Résumé du document analysé\n\n`;
            template += `${results.plainLanguageSummary}\n\n`;
            
            template += `Points clés identifiés\n\n`;
            results.flags.forEach((flag, index) => {
                template += `${index + 1}. ${flag.title}\n`;
                template += `Niveau de risque : ${flag.severity}\n`;
                template += `Explication : ${flag.explanation}\n`;
                template += `Suggestion d'amélioration : ${flag.suggestedRewrite}\n\n`;
            });
            
            template += `Recommandations\n\n`;
            results.aiInsights.recommendations.forEach((insight, index) => {
                template += `${index + 1}. ${insight.recommendation}\n`;
                template += `${insight.justification}\n\n`;
            });
            
            template += `Clauses suggérées\n\n`;
            template += `[Insérez ici les clauses spécifiques à votre ${documentType}]\n\n`;
            
            template += `Signatures\n\n`;
            template += `Partie 1 :\nNom : ___________________\nSignature : ___________________\nDate : ___________________\n\n`;
            template += `Partie 2 :\nNom : ___________________\nSignature : ___________________\nDate : ___________________\n\n`;

            setEditorContent(template);
        } catch (error) {
            console.error('Erreur lors de la génération du template:', error);
            alert('Erreur lors de la génération du template');
        } finally {
            setIsGenerating(false);
        }
    };

    const downloadAsWord = async () => {
        try {
            // Préparer les données pour l'API
            const documentData = {
                title: documentTypes.find(t => t.value === documentType)?.label || 'Document',
                date: new Date().toLocaleDateString('fr-FR'),
                sections: editorContent.split('\n\n').filter(p => p.trim()).map((para, idx) => ({
                    title: idx === 0 ? documentTypes.find(t => t.value === documentType)?.label || '' : '',
                    content: para
                }))
            };
            
            // Appeler l'API pour générer le document Word avec en-tête Porteo
            const response = await fetch('/api/generate-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    data: documentData,
                    headerType: 'porteo'
                })
            });
            
            if (!response.ok) {
                throw new Error('Erreur lors de la génération du document');
            }
            
            // Télécharger le fichier
            const blob = await response.blob();
            saveAs(blob, `document_${documentType}_${new Date().toISOString().split('T')[0]}.docx`);
        } catch (error) {
            console.error('Erreur export Word:', error);
            alert('Erreur lors de l\'export Word');
        }
    };

    const downloadAsPDF = async () => {
        try {
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            // Ajouter le logo
            const logoImg = new Image();
            logoImg.src = '/templates/porteo-logo.png';
            await new Promise((resolve) => {
                logoImg.onload = resolve;
            });
            pdf.addImage(logoImg, 'PNG', 20, 10, 50, 17);

            // Ajouter le contenu avec marges
            const marginLeft = 20;
            const marginTop = 35;
            const pageWidth = 210;
            const pageHeight = 297;
            const marginBottom = 25;
            const lineHeight = 7;
            let y = marginTop;

            pdf.setFontSize(12);
            const lines = editorContent.split('\n');
            
            lines.forEach((line) => {
                if (y > pageHeight - marginBottom) {
                    pdf.addPage();
                    pdf.addImage(logoImg, 'PNG', 20, 10, 50, 17);
                    y = marginTop;
                }
                
                const splitText = pdf.splitTextToSize(line || ' ', pageWidth - 2 * marginLeft);
                splitText.forEach((textLine: string) => {
                    pdf.text(textLine, marginLeft, y);
                    y += lineHeight;
                });
            });

            pdf.save(`document_${documentType}_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('Erreur export PDF:', error);
            alert('Erreur lors de l\'export PDF');
        }
    };

    const handleExport = () => {
        if (exportFormat === 'word') {
            downloadAsWord();
        } else {
            downloadAsPDF();
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(editorContent).then(() => {
            alert('Document copié dans le presse-papiers !');
        });
    };

    return (
        <div className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur">
            <div className="h-full flex flex-col">
                {/* Header */}
                <div className="bg-neutral-900 border-b border-neutral-700 p-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-white">Éditeur de Documents</h2>
                        <select
                            value={documentType}
                            onChange={(e) => setDocumentType(e.target.value)}
                            className="px-3 py-1 bg-neutral-800 text-white border border-neutral-600 rounded"
                        >
                            {documentTypes.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={generateTemplate}
                            disabled={isGenerating}
                            className="px-4 py-2 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white rounded hover:from-purple-700 hover:via-pink-600 hover:to-orange-600 disabled:opacity-50"
                        >
                            {isGenerating ? 'Génération...' : 'Générer Template'}
                        </button>
                        <select
                            value={exportFormat}
                            onChange={(e) => setExportFormat(e.target.value as 'word' | 'pdf')}
                            className="px-3 py-1 bg-neutral-800 text-white border border-neutral-600 rounded"
                        >
                            <option value="word">Word (.docx)</option>
                            <option value="pdf">PDF</option>
                        </select>
                        <button
                            onClick={handleExport}
                            disabled={!editorContent}
                            className="px-4 py-2 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white rounded hover:from-purple-700 hover:via-pink-600 hover:to-orange-600 disabled:opacity-50"
                        >
                            Télécharger {exportFormat === 'word' ? 'Word' : 'PDF'}
                        </button>
                        <button
                            onClick={copyToClipboard}
                            disabled={!editorContent}
                            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                        >
                            Copier
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                            Fermer
                        </button>
                    </div>
                </div>

                {/* Editor avec papier à en-tête */}
                <div className="flex-1 overflow-auto bg-neutral-800 p-8 pb-32">
                    <div 
                        ref={editorRef}
                        className="max-w-[210mm] mx-auto bg-white shadow-2xl"
                        style={{
                            minHeight: '297mm',
                            padding: '25mm 20mm',
                        }}
                    >
                        {/* Logo PORTEO GROUP */}
                        <div className="mb-8">
                            <img 
                                src="/templates/porteo-logo.png" 
                                alt="PORTEO GROUP" 
                                className="h-16"
                            />
                        </div>

                        {/* Contenu éditable */}
                        <textarea
                            value={editorContent}
                            onChange={(e) => setEditorContent(e.target.value)}
                            className="w-full min-h-[200mm] p-0 border-none outline-none resize-none text-black"
                            style={{
                                fontSize: '12pt',
                                lineHeight: '1.5',
                                fontFamily: 'Arial, sans-serif',
                            }}
                            placeholder="Commencez à écrire ou cliquez sur 'Générer Template' pour créer un document basé sur l'analyse..."
                        />
                    </div>
                </div>

                {/* Zone de prompt IA en bas */}
                <div className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-700 p-4 shadow-2xl">
                    <div className="max-w-4xl mx-auto">
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (!aiPrompt.trim() || isProcessingAI) return;
                            
                            setIsProcessingAI(true);
                            try {
                                // Appel API réel pour modifier le document
                                const response = await fetch('/api/chat', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        messages: [
                                            {
                                                role: 'system',
                                                content: 'Tu es un assistant juridique expert qui aide à rédiger et modifier des documents. Réponds UNIQUEMENT avec le texte modifié, sans explications supplémentaires.'
                                            },
                                            {
                                                role: 'user',
                                                content: `Document actuel:\n${editorContent}\n\nInstruction: ${aiPrompt}\n\nRéponds uniquement avec le document modifié selon l'instruction.`
                                            }
                                        ]
                                    })
                                });
                                
                                if (!response.ok) {
                                    throw new Error('Erreur lors de l\'appel API');
                                }
                                
                                const data = await response.json();
                                const modifiedContent = data.response || editorContent;
                                
                                setEditorContent(modifiedContent);
                                setAiPrompt('');
                            } catch (error) {
                                console.error('Erreur lors du traitement IA:', error);
                                alert('Erreur lors du traitement de votre demande. Veuillez réessayer.');
                            } finally {
                                setIsProcessingAI(false);
                            }
                        }} className="flex items-center gap-3">
                            <div className="flex-1 flex items-center gap-2 bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3">
                                <svg className="w-5 h-5 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <textarea
                                    ref={promptInputRef}
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            e.currentTarget.form?.requestSubmit();
                                        }
                                    }}
                                    placeholder="Demandez à l'IA de modifier le document (ex: 'Corriger l'orthographe', 'Résumer en 3 paragraphes', 'Ajouter une conclusion')..."
                                    className="flex-1 bg-transparent text-white placeholder-gray-500 border-0 outline-none resize-none text-sm"
                                    rows={1}
                                    disabled={isProcessingAI}
                                    style={{ maxHeight: '120px' }}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!aiPrompt.trim() || isProcessingAI}
                                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                                    aiPrompt.trim() && !isProcessingAI
                                        ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white hover:shadow-lg hover:shadow-purple-500/50'
                                        : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
                                }`}
                            >
                                {isProcessingAI ? (
                                    <div className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Traitement...</span>
                                    </div>
                                ) : (
                                    'Modifier'
                                )}
                            </button>
                        </form>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                            L'IA modifiera le document en temps réel selon vos instructions • <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded">Entrée</kbd> pour envoyer
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentEditor;

