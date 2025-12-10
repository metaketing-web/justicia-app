import React, { useState, useRef, useEffect } from 'react';
import { Upload, CheckCircle, XCircle, Loader } from 'lucide-react';
import { extractTextFromFile, detectDocumentType, getTextStats } from '../services/documentParser';
// import { formatAnalysisText } from '../utils/formatTitles';
import { addDocumentToRAG, checkRAGDuplicate } from '../services/ragService.enhanced';
import { generateDocumentAnalysis } from '../services/llama-api.services';
import { AnalysisResult } from '../types';

interface SimpleRAGUploadProps {
    onAnalysisComplete?: (result: AnalysisResult, fileName: string) => void;
}

/**
 * Nettoie le texte d'analyse pour enlever les artefacts JSON et markdown brut
 */
function cleanAnalysisText(text: string): string {
    if (!text) return text;
    
    // Enlever les préfixes JSON comme "## Analyse du Document { \"plainLanguageSummary\": \""
    let cleaned = text.replace(/^##\s*Analyse du Document\s*\{\s*"[^"]+"\s*:\s*"/i, '');
    
    // Enlever les suffixes comme "*Note: L'analyse complète a échoué..."
    cleaned = cleaned.replace(/\*Note:.*$/i, '');
    
    // Enlever les artefacts de parsing JSON en début de texte
    cleaned = cleaned.replace(/^\{\s*"[^"]+"\s*:\s*"/i, '');
    
    // Enlever les guillemets d'échappement excessifs
    cleaned = cleaned.replace(/\\n/g, '\n');
    cleaned = cleaned.replace(/\\"/g, '"');
    
    // Enlever les accolades finales orphelines
    cleaned = cleaned.replace(/\s*\}\s*$/g, '');
    
    // Nettoyer les espaces multiples
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    return cleaned.trim();
}

export const SimpleRAGUpload: React.FC<SimpleRAGUploadProps> = ({ onAnalysisComplete }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [currentStep, setCurrentStep] = useState<string>('');
    const [analysisPhrase, setAnalysisPhrase] = useState<string>('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    
    // Phrases progressives pendant l'analyse
    const analysisPhrases = [
        'Lecture du document...',
        'Analyse de la structure juridique...',
        'Évaluation des clauses contractuelles...',
        'Détection des risques potentiels...',
        'Calcul des scores de risque...',
        'Génération des recommandations...',
        'Finalisation de l\'analyse...'
    ];
    
    useEffect(() => {
        if (currentStep === 'Analyse Justicia en cours...') {
            let phraseIndex = 0;
            setAnalysisPhrase(analysisPhrases[0]);
            
            const interval = setInterval(() => {
                phraseIndex = (phraseIndex + 1) % analysisPhrases.length;
                setAnalysisPhrase(analysisPhrases[phraseIndex]);
            }, 3000); // Change de phrase toutes les 3 secondes
            
            return () => clearInterval(interval);
        }
    }, [currentStep]);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setMessage(null);

        try {
            // ÉTAPE 1: Extraction du texte
            setCurrentStep('📄 Extraction du texte...');
            console.log('[SimpleRAGUpload] Extraction du texte...');
            
            const text = await extractTextFromFile(file);
            
            if (!text || text.trim().length === 0) {
                throw new Error('Le fichier est vide ou ne contient pas de texte');
            }

            console.log(`[SimpleRAGUpload] Texte extrait: ${text.length} caractères`);
            
            // Vérification des doublons
            setCurrentStep('🔍 Vérification des doublons...');
            const duplicateCheck = await checkRAGDuplicate(file.name, text);
            
            if (duplicateCheck.exists) {
                const existingDoc = duplicateCheck.existingDoc!;
                const uploadDate = new Date(existingDoc.uploadDate).toLocaleDateString('fr-FR');
                
                const confirmUpload = window.confirm(
                    `⚠️ DOCUMENT DÉJÀ EXISTANT\n\n` +
                    `Un document identique ou similaire existe déjà dans la base RAG :\n\n` +
                    `📄 Nom : ${existingDoc.name}\n` +
                    `📅 Uploadé le : ${uploadDate}\n` +
                    `📊 Taille : ${existingDoc.content.length.toLocaleString()} caractères\n\n` +
                    `Voulez-vous quand même uploader ce document ?\n` +
                    `(Cela créera un doublon dans la base)`
                );
                
                if (!confirmUpload) {
                    setMessage({
                        type: 'error',
                        text: `❌ Upload annulé : Le document "${existingDoc.name}" existe déjà`
                    });
                    setUploading(false);
                    setCurrentStep('');
                    return;
                }
            }
            
            // ÉTAPE 2: Indexation dans la base RAG (COMPLET, sans troncature)
            setCurrentStep('🗄️ Indexation dans la base RAG...');
            const docType = detectDocumentType(text);
            const stats = getTextStats(text);
            
            const docId = await addDocumentToRAG(
                file.name,
                text, // Texte COMPLET, pas tronqué
                docType,
                {
                    uploadDate: new Date().toISOString(),
                    fileSize: file.size,
                    fileType: file.type,
                    wordCount: stats.words,
                    charCount: stats.characters
                }
            );

            console.log(`[SimpleRAGUpload] Document indexé dans RAG: ${docId}`);
            
            // ÉTAPE 3: Analyse du document
            setCurrentStep('Analyse Justicia en cours...');
            
            try {
                const analysisData = await generateDocumentAnalysis(text, docType);
                console.log('[SimpleRAGUpload] Analyse terminée avec succès');
                
                const fullAnalysisResult: AnalysisResult = {
                    docType,
                    stats,
                    plainLanguageSummary: cleanAnalysisText(analysisData.plainLanguageSummary),
                    flags: analysisData.flags,
                    riskAssessment: {
                        overallSummary: cleanAnalysisText(analysisData.aiInsights),
                        risks: analysisData.riskAssessment.risks
                    },
                    aiInsights: {
                        overallSummary: cleanAnalysisText(analysisData.aiInsights),
                        recommendations: []
                    }
                };
                
                // Notifier le parent de l'analyse complète
                if (onAnalysisComplete) {
                    onAnalysisComplete(fullAnalysisResult, file.name);
                }
                
                setMessage({
                    type: 'success',
                    text: `✅ ${file.name} indexé et analysé avec succès!`
                });
            } catch (analysisError) {
                console.error('[SimpleRAGUpload] Erreur lors de l\'analyse:', analysisError);
                // L'analyse a échoué mais le document est dans la base RAG
                setMessage({
                    type: 'success',
                    text: `✅ ${file.name} indexé dans la base RAG (analyse échouée mais vous pouvez poser des questions)`
                });
            }

            // Réinitialiser l'input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

        } catch (error) {
            console.error('[SimpleRAGUpload] Erreur:', error);
            setMessage({
                type: 'error',
                text: `❌ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
            });
        } finally {
            setUploading(false);
            setCurrentStep('');
        }
    };

    return (
        <div className="flex justify-center items-center mb-6">
            <div className="bg-gradient-to-br from-purple-900/20 via-pink-900/15 to-orange-900/20 border border-purple-500/30 rounded-lg p-4 w-full max-w-2xl">
                <div className="flex items-center gap-3 mb-3">
                    <Upload className="w-5 h-5 text-purple-400" />
                    <h3 className="text-base font-semibold text-white">Analyser un Document</h3>
                </div>
                
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 hover:from-purple-700 hover:via-pink-600 hover:to-orange-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium py-2.5 px-5 rounded-lg transition-all shadow-lg shadow-purple-500/20"
                    >
                    {uploading ? (
                        <>
                            <img src="/justicia_loader_perfect.gif" alt="Loading" className="w-12 h-12" />
                            <div className="flex flex-col items-start">
                                <span className="font-semibold">{currentStep || 'Traitement...'}</span>
                                {currentStep === 'Analyse Justicia en cours...' && (
                                    <span className="text-sm text-justicia-gradient animate-pulse font-semibold">{analysisPhrase}</span>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <Upload className="w-5 h-5" />
                            <span>Sélectionner un fichier</span>
                        </>
                    )}
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.docx,.txt,.md"
                    className="hidden"
                />

                {message && (
                    <div className={`flex items-center gap-2 p-3 rounded-lg ${
                        message.type === 'success' 
                            ? 'bg-green-900/30 border border-green-500/50 text-green-300' 
                            : 'bg-red-900/30 border border-red-500/50 text-red-300'
                    }`}>
                        {message.type === 'success' ? (
                            <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        ) : (
                            <XCircle className="w-5 h-5 flex-shrink-0" />
                        )}
                        <span className="text-sm">{message.text}</span>
                    </div>
                )}

                <p className="text-xs text-gray-400 text-center">
                    Formats: PDF, DOCX, TXT, MD
                </p>
                </div>
            </div>
        </div>
    );
};
