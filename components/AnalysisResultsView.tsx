import React, { useState, useRef, useMemo, useEffect } from 'react';
import './AnalysisFormatting.css';
import ReactDOM from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AnalysisResult, Flag, Risk, Insight } from '../types';
import {
    PlainLanguageIcon, LegalFindingsIcon, RiskAssessmentIcon, AiInsightsIcon, SpeakerIcon
} from '../constants';
import { speakTextWithOpenAI, stopSpeakingOpenAI } from '../services/openai-tts.service';
import jsPDF from 'jspdf';
import { v4 as uuidv4 } from 'uuid';
import { Document, Packer, Paragraph, HeadingLevel } from 'docx';
import DocumentInfographics from './DocumentInfographics';
import Heatmap3DView from './ARView';
import ReportGenerator from './ReportGenerator';
import DocumentEditor from './DocumentEditor';
import RAGSpace from './RAGSpace';

const getSeverityClass = (severity: 'Faible' | 'Moyen' | 'Élevé') => {
    switch (severity) {
        case 'Élevé': return 'bg-red-500/20 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.35)]';
        case 'Moyen': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.35)]';
        case 'Faible': return 'bg-sky-500/20 text-sky-400 border-sky-500/30 shadow-[0_0_10px_rgba(14,165,233,0.35)]';
        default: return 'bg-neutral-700 text-neutral-400';
    }
};

const AnalysisCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties
}> = ({ icon, title, children, className = '', style }) => {
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        cardRef.current.style.setProperty('--mouse-x', `${x}px`);
        cardRef.current.style.setProperty('--mouse-y', `${y}px`);
    };

    return (
    <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        className={`spotlight-card relative bg-black/20 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-lg transition-all duration-300 hover:border-justicia-gradient/50 glass-pane hover:-translate-y-1 ${className}`}
        style={style}
    >
        <div className="relative p-4 border-b border-white/5 flex items-center gap-3">
            <span className="text-justicia-gradient">{icon}</span>
            <h3 className="font-semibold text-white">{title}</h3>
        </div>
        <div className="relative p-4">
            {children}
        </div>
    </div>
    );
};

const FlagCard: React.FC<{ flag: Flag }> = ({ flag }) => {
    const [isSpeakingClause, setIsSpeakingClause] = useState(false);
    const [isSpeakingExplanation, setIsSpeakingExplanation] = useState(false);

    const handleListenClause = () => {
        if (isSpeakingClause) {
            stopSpeakingOpenAI();
            setIsSpeakingClause(false);
        } else {
            speakTextWithOpenAI(flag.clause, () => setIsSpeakingClause(false), 'cedar');
            setIsSpeakingClause(true);
        }
    };
    const handleListenExplanation = () => {
        if (isSpeakingExplanation) {
            stopSpeakingOpenAI();
            setIsSpeakingExplanation(false);
        } else {
            speakTextWithOpenAI(flag.explanation, () => setIsSpeakingExplanation(false), 'cedar');
            setIsSpeakingExplanation(true);
        }
    };
    return (
    <div className="p-4 rounded-lg border bg-neutral-800/50 border-neutral-700/80">
        <div className="flex justify-between items-start mb-2 gap-4">
            <h4 className="font-semibold text-white">{flag.title}</h4>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getSeverityClass(flag.severity)}`}>{flag.severity}</span>
        </div>
            <blockquote className="text-sm text-neutral-400 border-l-2 border-justicia-gradient/50 pl-3 my-2 italic flex items-center gap-2">
                <span id={flag.id}>"{flag.clause}"</span>
                <button
                    onClick={handleListenClause}
                    className={`ml-1 p-1 rounded-full border border-justicia-gradient text-justicia-gradient hover:bg-justicia-gradient/10 transition ${isSpeakingClause ? 'bg-justicia-gradient/20' : ''}`}
                    aria-label={isSpeakingClause ? 'Stop listening' : 'Listen to clause'}
                >
                    <SpeakerIcon className="w-4 h-4" />
                </button>
        </blockquote>
            <div className="flex items-center gap-2 mt-2">
                <p className="text-sm text-neutral-300 flex-1">{flag.explanation}</p>
                <button
                    onClick={handleListenExplanation}
                    className={`ml-1 p-1 rounded-full border border-justicia-gradient text-justicia-gradient hover:bg-justicia-gradient/10 transition ${isSpeakingExplanation ? 'bg-justicia-gradient/20' : ''}`}
                    aria-label={isSpeakingExplanation ? 'Stop listening' : 'Listen to explanation'}
                >
                    <SpeakerIcon className="w-4 h-4" />
                </button>
            </div>
            {flag.suggestedRewrite && (
                <div className="mt-4 p-3 bg-justicia-gradient/10 border-l-4 border-justicia-gradient rounded">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-justicia-gradient">Suggestion:</span>
                    </div>
                    <p className="text-sm text-justicia-gradient font-medium">{flag.suggestedRewrite}</p>
                </div>
            )}
    </div>
);
};

const RiskBar: React.FC<{ risk: Risk }> = ({ risk }) => {
    let barColor = 'bg-justicia-gradient';
    if (risk.score > 7) barColor = 'bg-red-500';
    else if (risk.score > 4) barColor = 'bg-yellow-400';

    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-medium text-neutral-200">{risk.area}</p>
                <p className={`text-sm font-bold ${risk.score > 7 ? 'text-red-400' : risk.score > 4 ? 'text-yellow-400' : 'text-justicia-gradient'}`}>{risk.score} / 10</p>
            </div>
            <div className="w-full bg-neutral-700 rounded-full h-2 overflow-hidden">
                <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${risk.score * 10}%` }}></div>
            </div>
             <p className="text-xs text-neutral-400 mt-1.5">{risk.assessment}</p>
        </div>
    );
};

const InsightCard: React.FC<{ insight: Insight }> = ({ insight }) => (
     <div className="p-4 rounded-lg bg-neutral-800/50 border border-neutral-700/80">
        <h4 className="font-semibold text-white mb-1.5">{insight.recommendation}</h4>
        <p className="text-sm text-neutral-300">{insight.justification}</p>
    </div>
);

// const ChevronDownIcon = ({ className = '' }) => (
//   <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
//     <path d="M6 8L10 12L14 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
//   </svg>
// );

interface AnalysisResultsViewProps {
    results: AnalysisResult;
    fullText: string;
    analyticsOpen?: boolean;
    onCloseAnalytics?: () => void;
    historyOpen?: boolean;
    onCloseHistory?: () => void;
    activeSessionId?: string;
    onShowVoiceChat?: () => void;
}

const AnalysisResultsView: React.FC<AnalysisResultsViewProps> = ({ results, fullText, analyticsOpen, onCloseAnalytics, historyOpen, onCloseHistory, activeSessionId, onShowVoiceChat }) => {
    // const [isSpeaking, setIsSpeaking] = useState(false);
    // const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    // const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | undefined>(undefined);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [showCopied, setShowCopied] = useState(false);
    const [historyList, setHistoryList] = useState<any[]>([]);
    // const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
    const detectedType = results.detectedDocType || results.docType || 'Uploaded Document';
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
    const [showShareDropdown, setShowShareDropdown] = useState(false);
    const [shareDropdownPosition, setShareDropdownPosition] = useState<{top: number, left: number, width: number} | null>(null);
    const shareButtonRef = useRef<HTMLButtonElement>(null);
    const downloadButtonRef = useRef<HTMLButtonElement>(null);
    const [downloadDropdownPosition, setDownloadDropdownPosition] = useState<{top: number, left: number, width: number} | null>(null);
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [showReportGenerator, setShowReportGenerator] = useState(false);
    const [showDocumentEditor, setShowDocumentEditor] = useState(false);
    const [showRAGSpace, setShowRAGSpace] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    // Generate a new random seed for each analysis/chat
    const heatmapSeed = useMemo(() => Math.random().toString(36).slice(2), [results, activeSessionId]);
    // Auto-close heatmap on chat/session switch
    useEffect(() => {
        setShowHeatmap(false);
    }, [activeSessionId]);

    // Load voices on mount and when voices change
    // useEffect(() => {
    //     const loadVoices = () => {
    //         const voicesList = window.speechSynthesis.getVoices();
    //         setVoices(voicesList);
    //         // Load default from localStorage
    //         const storedDefault = localStorage.getItem('justicia_default_voice');
    //         if (storedDefault && voicesList.some(v => v.voiceURI === storedDefault)) {
    //             setSelectedVoiceURI(storedDefault);
    //         } else if (!selectedVoiceURI && voicesList.length > 0) {
    //             setSelectedVoiceURI(voicesList[0].voiceURI);
    //         }
    //     };
    //     loadVoices();
    //     window.speechSynthesis.onvoiceschanged = loadVoices;
    //     return () => { window.speechSynthesis.onvoiceschanged = null; };
    // }, []); // Only run once on mount

    // Close dropdown on outside click
    useEffect(() => {
        if (!dropdownOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [dropdownOpen]);

    // Save analysis to history on mount
    useEffect(() => {
        const history = JSON.parse(localStorage.getItem('justicia_analysis_history') || '[]');
        const id = uuidv4();
        const newEntry = {
            id,
            date: new Date().toISOString(),
            title: detectedType,
            results,
            fullText,
        };
        // Only add if not already present (by content hash or similar)
        const exists = history.some((h: any) => JSON.stringify(h.results) === JSON.stringify(results));
        if (!exists) {
            const updated = [newEntry, ...history].slice(0, 20); // Keep last 20
            localStorage.setItem('justicia_analysis_history', JSON.stringify(updated));
            setHistoryList(updated);
        } else {
            setHistoryList(history);
        }
    }, [results, fullText, detectedType]);

    const handleLoadHistory = () => {
        window.location.reload(); // For now, reload to trigger analysis view (can be improved to set state)
        // In a more advanced app, you would set the analysis state directly
    };

    // const selectedVoice = voices.find(v => v.voiceURI === selectedVoiceURI); // Unused - using OpenAI TTS now

    // const setDefaultVoice = (voiceURI: string) => {
    //     localStorage.setItem('justicia_default_voice', voiceURI);
    //     setSelectedVoiceURI(voiceURI);
    // };

    // Concatenate all analysis text for TTS
    const getFullAnalysisText = () => {
        let text = '';
        text += `Analysis for: ${detectedType}.\n`;
        text += `Résumé en Langage Simple : ${results.plainLanguageSummary}\n`;
        text += `Évaluation des Risques : ${results.riskAssessment.overallSummary}\n`;
        results.riskAssessment.risks.forEach(risk => {
            text += `${risk.area}: ${risk.assessment} (Score: ${risk.score}/10)\n`;
        });
        text += `Analyses IA : ${results.aiInsights.overallSummary}\n`;
        results.aiInsights.recommendations.forEach(insight => {
            text += `${insight.recommendation}: ${insight.justification}\n`;
        });
        if (results.flags.length > 0) {
            text += 'Signalements Trouvés : ';
            results.flags.forEach(flag => {
                text += `${flag.title}: ${flag.clause}. Explanation: ${flag.explanation}.`;
                if (flag.suggestedRewrite) text += ` Suggested Rewrite: ${flag.suggestedRewrite}.`;
                text += '\n';
            });
        }
        return text;
    };

    // const handleListen = () => {
    //     if (isSpeaking) {
    //         stopSpeakingOpenAI();
    //         setIsSpeaking(false);
    //     } else {
    //         speakTextWithOpenAI(getFullAnalysisText(), () => setIsSpeaking(false), 'cedar');
    //         setIsSpeaking(true);
    //     }
    // };

    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 12;
        const lineHeight = 8;
        let y = margin + 4;
        const maxLineWidth = pageWidth - margin * 2;
        function addTextBlock(text: string, fontSize = 12, indent = 0) {
            doc.setFontSize(fontSize);
            const lines = doc.splitTextToSize(text, maxLineWidth - indent);
            for (let line of lines) {
                if (y + lineHeight > pageHeight - margin) {
                    doc.addPage();
                    y = margin;
                }
                doc.text(line, margin + indent, y);
                y += lineHeight;
            }
        }
        doc.setFontSize(16);
        addTextBlock(`Analysis for: ${detectedType}`, 16);
        y += 2;
        addTextBlock('Résumé en Langage Simple :', 13);
        addTextBlock(results.plainLanguageSummary, 12, 6);
        y += 2;
        addTextBlock('Évaluation des Risques :', 13);
        addTextBlock(results.riskAssessment.overallSummary, 12, 6);
        for (const risk of results.riskAssessment.risks) {
            addTextBlock(`${risk.area}: ${risk.assessment} (Score: ${risk.score}/10)`, 12, 12);
        }
        y += 2;
        addTextBlock('Analyses IA :', 13);
        addTextBlock(results.aiInsights.overallSummary, 12, 6);
        for (const insight of results.aiInsights.recommendations) {
            addTextBlock(`${insight.recommendation}: ${insight.justification}`, 12, 12);
        }
        if (results.flags.length > 0) {
            y += 2;
            addTextBlock('Signalements Trouvés :', 13);
            for (const flag of results.flags) {
                addTextBlock(`${flag.title}: ${flag.clause}`, 12, 6);
                addTextBlock(`Explanation: ${flag.explanation}`, 12, 12);
                if (flag.suggestedRewrite) {
                    addTextBlock(`Suggested Rewrite: ${flag.suggestedRewrite}`, 12, 12);
                }
            }
        }
        doc.save(`analysis-${detectedType.replace(/\s+/g, '_')}.pdf`);
    };

    const handleDownloadDOCX = async () => {
        setIsDownloading(true);
        try {
            // Importer le service de génération Word
            const { generateAnalysisDocument } = await import('../services/wordDocumentService');
            
            // Construire le contenu Markdown de l'analyse
            let content = `# ${detectedType}\n\n`;
            
            content += `## Résumé\n\n${results.plainLanguageSummary}\n\n`;
            
            content += `## Évaluation des Risques\n\n${results.riskAssessment.overallSummary}\n\n`;
            results.riskAssessment.risks.forEach(risk => {
                content += `- **${risk.area}** : ${risk.assessment} (Score: ${risk.score}/10)\n`;
            });
            
            content += `\n## Analyses IA\n\n${results.aiInsights.overallSummary}\n\n`;
            results.aiInsights.recommendations.forEach(insight => {
                content += `- **${insight.recommendation}** : ${insight.justification}\n`;
            });
            
            if (results.flags.length > 0) {
                content += `\n## Signalements Trouvés\n\n`;
                results.flags.forEach(flag => {
                    content += `### ${flag.title}\n\n`;
                    content += `**Clause** : ${flag.clause}\n\n`;
                    content += `**Explication** : ${flag.explanation}\n\n`;
                    if (flag.suggestedRewrite) {
                        content += `**Réécriture suggérée** : ${flag.suggestedRewrite}\n\n`;
                    }
                });
            }
            
            // Générer et télécharger le document Word avec en-tête Justicia
            await generateAnalysisDocument(
                `Analyse - ${detectedType}`,
                content,
                `rapport_justicia_${Date.now()}.docx`
            );
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de la génération du document Word');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleShare = () => {
        // For now, generate a local link with a hash (could be improved with backend)
        const shareUrl = `${window.location.origin}${window.location.pathname}#analysis-${Date.now()}`;
        navigator.clipboard.writeText(shareUrl);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
    };

    const handleEmail = () => {
        const subject = encodeURIComponent(`Analysis for: ${detectedType}`);
        const body = encodeURIComponent(getFullAnalysisText());
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    };

    const riskData = results.riskAssessment?.risks?.map(risk => ({ area: risk.area, score: risk.score })) || [];

    // Analytics modal content
    const renderAnalyticsModal = (onClose: () => void) => (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur animate-fadeIn" onClick={onClose}>
            <div className="bg-neutral-900 p-6 rounded-xl shadow-2xl max-w-lg w-full flex flex-col" style={{ maxHeight: '360px' }} onClick={() => {}}>
                <div className="flex-1 min-h-0 overflow-y-auto">
                    <h2 className="text-2xl font-bold mb-2 text-white">Analyses et Statistiques</h2>
                    <div className="mb-2 text-white text-base">
                        <div><strong>Documents Analysés :</strong> {historyList.length}</div>
                        <div><strong>Total Signalements Trouvés :</strong> {historyList.reduce((sum: number, item: any) => sum + (item.results.flags?.length || 0), 0)}</div>
                        <div><strong>Score de Risque Moyen :</strong> {historyList.length ? (historyList.reduce((a: number, item: any) => a + (item.results.riskAssessment?.risks?.reduce((sum: number, r: any) => sum + r.score, 0) || 0), 0) / historyList.length).toFixed(2) : 'N/A'}</div>
                    </div>
                    <div className="mb-2">
                        <div className="font-semibold text-white mb-1 text-base">Évolution du Score de Risque (10 derniers docs)</div>
                        <svg width="220" height="80" viewBox="0 0 220 80" className="bg-neutral-800 rounded-lg">
                            {[...Array(5)].map((_, i) => (
                                <line key={i} x1={24} x2={200} y1={12 + i*16} y2={12 + i*16} stroke="#444" strokeDasharray="2 2" />
                            ))}
                            {historyList.slice(0, 10).map((_: any, i: number) => (
                                <text key={i} x={24 + i*20} y={77} fontSize="12" fill="#aaa" textAnchor="middle">{i+1}</text>
                            ))}
                            {historyList.slice(0, 10).map((item: any, i: number) => {
                                const avg = item.results.riskAssessment?.risks?.length
                                    ? item.results.riskAssessment.risks.reduce((a: number, b: any) => a + b.score, 0) / item.results.riskAssessment.risks.length
                                    : 0;
                                return (
                                    <rect key={i} x={24 + i*20 - 7} y={12 + (64 - avg*6.4)} width={14} height={avg*6.4} fill="#8B5CF6" rx={2} />
                                );
                            })}
                            {[0,2,4,6,8,10].map((v, i) => (
                                <text key={i} x={16} y={80 - i*13} fontSize="12" fill="#aaa" textAnchor="end">{v}</text>
                            ))}
                        </svg>
                    </div>
                </div>
                <div className="sticky bottom-0 left-0 right-0 bg-neutral-900 pt-2 pb-1 z-10">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 bg-justicia-gradient text-white hover:text-black rounded-full font-semibold shadow hover:bg-justicia-gradient/80 transition text-base"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );

    // History modal content
    const renderHistoryModal = (onClose: () => void) => (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur animate-fadeIn" onClick={onClose}>
            <div className="bg-neutral-900 p-6 rounded-xl shadow-2xl max-w-lg w-full flex flex-col" style={{ maxHeight: '360px' }} onClick={() => {}}>
                <div className="flex-1 min-h-0 overflow-y-auto">
                    <h2 className="text-2xl font-bold mb-2 text-white">Historique d'Analyse</h2>
                    {historyList.length === 0 && <div className="px-2 py-1 text-gray-400 text-base">No history yet.</div>}
                    {historyList.map(item => (
                        <button
                            key={item.id}
                            onClick={() => handleLoadHistory()}
                            className="w-full text-left px-2 py-1 border-b border-neutral-800 hover:bg-justicia-gradient/10 transition text-base"
                        >
                            <div className="font-bold text-white truncate">{item.title}</div>
                            <div className="text-xs text-gray-400">{new Date(item.date).toLocaleString()}</div>
                        </button>
                    ))}
                </div>
                <div className="sticky bottom-0 left-0 right-0 bg-neutral-900 pt-2 pb-1 z-10">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 bg-justicia-gradient text-white hover:text-black rounded-full font-semibold shadow hover:bg-justicia-gradient/80 transition text-base"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="flex flex-row-reverse items-center justify-between mb-4 gap-3">
                <div className="flex gap-2 items-center" ref={dropdownRef}>
                    {onShowVoiceChat && (
                        <button
                            onClick={onShowVoiceChat}
                            className="group px-4 py-3 rounded-full border-2 border-green-600/50 font-semibold bg-green-900/20 hover:bg-green-800/30 transition shadow-lg text-base flex items-center gap-2"
                            title="Discuter vocalement de ce document"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                            <span className="text-white group-hover:text-white transition">🎤 Vocal</span>
                        </button>
                    )}
                    <button
                        ref={downloadButtonRef}
                        onClick={() => {
                            setShowDownloadDropdown(v => !v);
                            if (!showDownloadDropdown && downloadButtonRef.current) {
                                const rect = downloadButtonRef.current.getBoundingClientRect();
                                setDownloadDropdownPosition({
                                    top: rect.bottom + window.scrollY,
                                    left: rect.left + window.scrollX,
                                    width: rect.width
                                });
                            }
                        }}
                        className="group px-4 py-3 rounded-full border-2 border-neutral-700 font-semibold bg-neutral-900/50 hover:bg-neutral-800 transition shadow-lg text-base"
                        style={{ minWidth: 120 }}
                    >
                        <span className="text-white group-hover:text-white transition">Télécharger</span>
                    </button>
                    {showDownloadDropdown && downloadDropdownPosition && ReactDOM.createPortal(
                        <div
                            className="absolute z-[20000] w-40 bg-neutral-900 border border-neutral-700 rounded-xl shadow-xl animate-fadeIn"
                            style={{
                                position: 'absolute',
                                top: downloadDropdownPosition.top,
                                left: downloadDropdownPosition.left,
                                minWidth: downloadDropdownPosition.width,
                            }}
                        >
                            <button
                                onClick={() => { handleDownloadPDF(); setShowDownloadDropdown(false); }}
                                className="w-full text-left px-4 py-2 hover:bg-justicia-gradient/10 text-white"
                            >
                                PDF
                            </button>
                            <button
                                onClick={() => { handleDownloadDOCX(); setShowDownloadDropdown(false); }}
                                disabled={isDownloading}
                                className="w-full text-left px-4 py-2 hover:bg-justicia-gradient/10 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isDownloading && (
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                )}
                                <span>DOCX{isDownloading ? ' (en cours...)' : ''}</span>
                            </button>
                        </div>,
                        document.body
                    )}
                </div>
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 flex-1">{detectedType}</h3>
            </div>
            {/* Bouton "Voir la Carte de Chaleur" supprimé */}
            <div className="flex flex-row gap-6 w-full">
                {/* Left: Analysis Cards (70%) */}
                <div className="flex-1 w-[70%] space-y-6">
                    <AnalysisCard
                        icon={<PlainLanguageIcon className="w-6 h-6" />}
                        title="Résumé"
                    >
                        <div className="analysis-content text-neutral-300 leading-relaxed flex-1 prose prose-invert prose-sm max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {results.plainLanguageSummary}
                            </ReactMarkdown>
                        </div>
                    </AnalysisCard>
                    <AnalysisCard
                        icon={<RiskAssessmentIcon className="w-6 h-6" />}
                        title="Évaluation des Risques"
                    >
                        <div className="analysis-content mb-2 prose prose-invert prose-sm max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {results.riskAssessment.overallSummary}
                            </ReactMarkdown>
                        </div>
                        <div className="space-y-3 mt-2">
                            {results.riskAssessment.risks.map((risk, i) => (
                                <RiskBar key={i} risk={risk} />
                            ))}
                        </div>
                    </AnalysisCard>
                    <AnalysisCard
                        icon={<AiInsightsIcon className="w-6 h-6" />}
                        title="Analyses IA"
                    >
                        <div className="analysis-content mb-2 prose prose-invert prose-sm max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {results.aiInsights.overallSummary}
                            </ReactMarkdown>
                        </div>
                        <div className="space-y-3 mt-2">
                            {results.aiInsights.recommendations.map((insight, i) => (
                                <InsightCard key={i} insight={insight} />
                            ))}
                        </div>
                    </AnalysisCard>
                    <AnalysisCard
                        icon={<LegalFindingsIcon className="w-6 h-6" />}
                        title="Signalements Trouvés"
                    >
                        <div className="space-y-4">
                            {results.flags.length > 0 ? (
                                results.flags.map(flag => (
                                    <div key={flag.id} className="cursor-pointer transition border-l-4 pl-2 border-transparent hover:bg-neutral-800/50">
                                        <FlagCard flag={flag} />
                                    </div>
                                ))
                            ) : (
                                <p className="text-neutral-400">No significant flags were detected in the document.</p>
                            )}
                        </div>
                    </AnalysisCard>
                </div>
                {/* Right: Infographics Sidebar (30%) */}
                <div className="w-[30%] min-w-[320px] flex-shrink-0 sticky top-8 h-fit">
                    <DocumentInfographics results={results} />
                </div>
            </div>
            {analyticsOpen && renderAnalyticsModal(onCloseAnalytics || (() => {})) }
            {historyOpen && renderHistoryModal(onCloseHistory || (() => {})) }
            {showCopied && (
                <div className="absolute top-0 right-0 mt-[-2.5rem] mr-2 bg-justicia-gradient text-white hover:text-black px-4 py-2 rounded shadow-lg animate-fadeIn z-50">
                    Lien copié !
                </div>
            )}
            {/* Bouton Télécharger le Rapport Complet */}
            <div className="flex justify-center my-8">
                <button
                    onClick={handleDownloadDOCX}
                    disabled={isDownloading}
                    className="px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 hover:from-purple-700 hover:via-pink-600 hover:to-orange-600 text-white font-bold rounded-lg shadow-lg transform transition hover:scale-105 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                    {isDownloading ? (
                        <>
                            <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-lg">Téléchargement en cours...</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-lg">Télécharger le rapport</span>
                        </>
                    )}
                </button>
            </div>
            
            {/* Nouveaux composants */}
            {showReportGenerator && (
                <ReportGenerator
                    results={results}
                    documentTitle={detectedType}
                    onClose={() => setShowReportGenerator(false)}
                />
            )}
            
            {showDocumentEditor && (
                <DocumentEditor
                    results={results}
                    documentContent={fullText}
                    onClose={() => setShowDocumentEditor(false)}
                />
            )}
            
            {showRAGSpace && (
                <RAGSpace
                    onClose={() => setShowRAGSpace(false)}
                />
            )}
        </div>
    );
};

export default AnalysisResultsView;