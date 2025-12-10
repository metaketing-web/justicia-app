import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatPanel from './components/ChatPanel';
import InitialView from './components/InitialView';
import AnalysisResultsView from './components/AnalysisResultsView';
import AnalysisLoadingView from './components/AnalysisLoadingView';
import AnalysisModal from './components/AnalysisModal';
import LoginPage from './components/LoginPage';

import { Message, MessageRole, ChatSession, User, AnalysisResult, ChatFolder } from './types';
import { v4 as uuidv4 } from 'uuid';
import { generateTitleFromMessage, streamChatResponse, generateDocumentAnalysis, generateContractTemplate } from './services/llama-api.services';
import { readExcelFile, excelToText } from './services/excelService';
import { addDocumentToRAG } from './services/ragService.enhanced';
import { initializeRAGWithCodeTravail } from './services/ragInitializer';
import { smartExtractText } from './services/ocr.service';
import { storageService } from './services/storageService';
import { onAuthStateChange } from './services/firebaseService';
import { extractTextFromFile, cleanText, detectDocumentType, getTextStats } from './services/documentParser';
import { CheckIcon, JusticiaLogo } from './constants';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import SignaturePad from './components/SignaturePad';
import CollaborativeEditor from './components/CollaborativeEditor';
import VoiceChat from './components/VoiceChat';
import KnowledgeBaseManager from './components/KnowledgeBaseManager';
import TemplateGallery from './components/TemplateGallery';
import DocumentTemplateSelector from './components/DocumentTemplateSelector';
import DocumentGenerationForm from './components/DocumentGenerationForm';
import DocumentHistory from './components/DocumentHistory';
import BlankDocumentEditor from './components/BlankDocumentEditor';
import { DocumentTemplate } from './config/documentTemplates';
import { addDocumentToHistory } from './services/documentHistory.service';
import AccountSettings from './components/AccountSettings';
import AppSettingsComponent from './components/AppSettings';

// PDF.js worker configuration - disable worker to use main thread
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = '/pdf.worker.js';
console.log('[DEBUG] PDF.js worker disabled, using main thread');

const useMediaQuery = (query: string) => {
    const [matches, setMatches] = useState(false);
    useEffect(() => {
        const media = window.matchMedia(query);
        setMatches(media.matches);
        
        const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }, [query]);
    return matches;
};

const createNewSession = (): ChatSession => ({
    id: uuidv4(),
    title: 'Nouveau Chat',
    messages: [
        {
            id: uuidv4(),
            role: MessageRole.ASSISTANT,
            content: "Bonjour ! Je suis votre assistant IA Justicia. Téléchargez un document ou posez-moi une question pour commencer.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ],
    createdAt: new Date().toISOString(),
    analysis: null,
});

const DropzoneOverlay: React.FC = () => (
    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 animate-fadeIn backdrop-blur-sm">
        <div className="w-4/5 max-w-2xl p-12 border-4 border-dashed border-justicia-gradient rounded-2xl text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Déposez le Fichier pour Commencer l'Analyse</h2>
            <p className="text-gray-300">Relâchez le fichier pour le télécharger et commencer votre session.</p>
        </div>
    </div>
);

const Toast: React.FC<{ message: string; onDismiss: () => void; }> = ({ message, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 3000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-toast-in">
            <div className="flex items-center gap-3 bg-neutral-800 border border-neutral-700 text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-2xl">
                <CheckIcon className="w-5 h-5 text-justicia-gradient" />
                <span>{message}</span>
            </div>
        </div>
    );
};

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [folders, setFolders] = useState<ChatFolder[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [isAnalysisModalOpen, setAnalysisModalOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dragCounter = useRef(0);
    const isMobile = useMediaQuery('(max-width: 768px)');

    const [fullText, setFullText] = useState<string>('');
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [showDocumentTemplateSelector, setShowDocumentTemplateSelector] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
    const [showDocumentHistory, setShowDocumentHistory] = useState(false);
    const [showBlankDocumentEditor, setShowBlankDocumentEditor] = useState(false);
    const [templateType, setTemplateType] = useState('Contrat de Freelance');
    const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false);
    const [generatedTemplate, setGeneratedTemplate] = useState<string | null>(null);
    const [templateFlags, setTemplateFlags] = useState<any[] | null>(null);
    const [templateError, setTemplateError] = useState<string | null>(null);
    const [showSignaturePad, setShowSignaturePad] = useState(false);
    const [showCollaborativeEditor, setShowCollaborativeEditor] = useState(false);
    const [editorContent, setEditorContent] = useState('');
    const [editorTitle, setEditorTitle] = useState('');
    const [showVoiceChat, setShowVoiceChat] = useState(false);
    const [voiceChatContext, setVoiceChatContext] = useState('');
    const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);
    const [collaborativeDocuments, setCollaborativeDocuments] = useState<any[]>([]);
    const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
    const [analyticsOpen, setAnalyticsOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [showAccountSettings, setShowAccountSettings] = useState(false);
    const [showAppSettings, setShowAppSettings] = useState(false);
    const [appSettings, setAppSettings] = useState({
        language: 'fr',
        theme: 'dark' as 'light' | 'dark' | 'system',
        receiveExclusiveContent: true,
        emailOnTaskStart: true,
        autoSaveDocuments: true,
        showAnalysisSummary: true,
        enableVoiceChat: true,
        dataRetention: 90
    });

    const contractTypes = [
        'Contrat de Freelance',
        'Accord de Non-Divulgation (NDA)',
        'Contrat de Travail',
        'Accord de Conseil',
        'Contrat de Bail',
        'Accord de Service',
        'Accord de Partenariat',
        'Contrat de Vente',
    ];

    const handleGenerateTemplate = async () => {
        setIsGeneratingTemplate(true);
        setGeneratedTemplate(null);
        setTemplateFlags(null);
        setTemplateError(null);
        try {
            const result = await generateContractTemplate(templateType);
            console.log('Raw AI template result:', result); // Debug log
            // Strict validation: template must be a string, not repeated, not empty
            if (typeof result.template !== 'string' || !result.template.trim() || /\b(\w+) \1\b/.test(result.template)) {
                throw new Error('AI did not return a valid template. Please try again.');
            }
            setGeneratedTemplate(result.template.trim());
            setTemplateFlags(result.flags);
        } catch (err: any) {
            setTemplateError(err.message || 'Failed to generate template.');
            setGeneratedTemplate(null);
            setTemplateFlags(null);
        } finally {
            setIsGeneratingTemplate(false);
        }
    };

    const handleDownloadTemplate = () => {
        if (!generatedTemplate) return;
        const blob = new Blob([generatedTemplate], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${templateType.replace(/\s+/g, '_')}_template.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleSaveSignature = (dataUrl: string) => {
        setSignatureDataUrl(dataUrl);
        setShowSignaturePad(false);
    };
    const handleDownloadSignature = () => {
        if (!signatureDataUrl) return;
        const a = document.createElement('a');
        a.href = signatureDataUrl;
        a.download = 'signature.png';
        a.click();
    };

    const handleDownloadSignedDocument = async () => {
        if (!generatedTemplate || !signatureDataUrl) return;
        // Create an off-screen canvas
        const canvas = document.createElement('canvas');
        const width = 800;
        const lineHeight = 28;
        const padding = 32;
        // Word wrap logic
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.font = '18px monospace';
        const maxTextWidth = width - 2 * padding;
        const templateLines = generatedTemplate.split('\n');
        // Word wrap each line
        const wrappedLines: string[] = [];
        templateLines.forEach(line => {
            if (ctx.measureText(line).width <= maxTextWidth) {
                wrappedLines.push(line);
            } else {
                let words = line.split(' ');
                let current = '';
                for (let word of words) {
                    const test = current ? current + ' ' + word : word;
                    if (ctx.measureText(test).width > maxTextWidth) {
                        if (current) wrappedLines.push(current);
                        current = word;
                    } else {
                        current = test;
                    }
                }
                if (current) wrappedLines.push(current);
            }
        });
        // Estimate height: lines of template + signature
        const height = padding * 2 + wrappedLines.length * lineHeight + 200;
        canvas.width = width;
        canvas.height = height;
        // Background - BLANC pour documents professionnels
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        // Dessiner le logo PORTEO GROUP en haut
        const logo = new window.Image();
        logo.src = '/templates/porteo-logo.png';
        logo.onload = () => {
            // Logo en haut à gauche
            ctx.drawImage(logo, padding, padding, 150, 50);
            
            // Draw wrapped template text - ALIGNÉ À GAUCHE avec police professionnelle
            ctx.font = '14px Georgia, serif';
            ctx.fillStyle = '#000000'; // Texte NOIR
            ctx.textAlign = 'left';
            
            let currentY = padding + 80; // Commencer après le logo
            
            wrappedLines.forEach((line) => {
                // Titres en or/bronze (#C9A05C)
                if (line.match(/^[A-Z\s]+$/) || line.startsWith('Article')) {
                    ctx.font = 'bold 16px Georgia, serif';
                    ctx.fillStyle = '#C9A05C';
                } else {
                    ctx.font = '14px Georgia, serif';
                    ctx.fillStyle = '#000000';
                }
                
                ctx.fillText(line, padding, currentY);
                currentY += lineHeight;
            });
            
            // Draw signature image
            const sigImg = new window.Image();
            sigImg.onload = () => {
                // Place signature at bottom right
                const sigWidth = 240;
                const sigHeight = 90;
                ctx.drawImage(sigImg, width - sigWidth - padding, height - sigHeight - padding, sigWidth, sigHeight);
                // Download
                const url = canvas.toDataURL('image/png');
                const a = document.createElement('a');
                a.href = url;
                a.download = `${templateType.replace(/\s+/g, '_')}_signed.png`;
                a.click();
            };
            sigImg.src = signatureDataUrl;
        };

    };

    // Debug logging
    useEffect(() => {
        console.log('Mobile detection:', isMobile, 'Sidebar expanded:', isSidebarExpanded);
    }, [isMobile, isSidebarExpanded]);

    // Immediate mobile detection on mount
    useEffect(() => {
        const checkMobile = () => {
            const isMobileView = window.innerWidth <= 768;
            if (isMobileView && isSidebarExpanded) {
                setIsSidebarExpanded(false);
            }
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Initialiser la base RAG avec le Code du Travail au démarrage
    useEffect(() => {
        initializeRAGWithCodeTravail().catch(err => {
            console.error('[App] Erreur lors de l\'initialisation RAG:', err);
        });
    }, []);

    // Auth effect - runs once
    useEffect(() => {
        // Charger le profil utilisateur depuis localStorage
        const savedUser = localStorage.getItem('justiciaUser');
        if (savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);
                setCurrentUser(parsedUser);
                console.log('Profil chargé depuis localStorage:', parsedUser);
            } catch (error) {
                console.error('Erreur lors du chargement du profil:', error);
            }
        }
        
        const unsubscribe = onAuthStateChange((user: User | null) => {
            // Si pas d'utilisateur en localStorage, utiliser celui de l'auth
            if (!savedUser && user) {
                setCurrentUser(user);
            }
            setIsLoadingAuth(false);
        });

        const savedSidebarState = storageService.getItem('justiciaSidebarState');
        if (savedSidebarState !== null) {
            try {
                const savedState = JSON.parse(savedSidebarState);
                // Only restore saved state if not on mobile
                if (!isMobile) {
                    setIsSidebarExpanded(savedState);
                } else {
                    setIsSidebarExpanded(false);
                }
            } catch (error) {
                console.error("Failed to parse sidebar state from storage", error);
                setIsSidebarExpanded(!isMobile);
            }
        } else {
            setIsSidebarExpanded(!isMobile);
        }
        
        return () => unsubscribe();
    }, [isMobile]);
    
    // Session and folders loading effect - depends on user
    useEffect(() => {
        if (!currentUser || isLoadingAuth) {
            setSessions([]);
            setFolders([]);
            setActiveSessionId(null);
            return;
        }

        const sessionKey = `justiciaSessions_${currentUser.id}`;
        const foldersKey = `justiciaFolders_${currentUser.id}`;
        
        // Load folders
        try {
            const savedFolders = storageService.getItem(foldersKey);
            if (savedFolders) {
                const parsedFolders = JSON.parse(savedFolders);
                if (Array.isArray(parsedFolders)) {
                    setFolders(parsedFolders);
                }
            }
        } catch (error) {
            console.error("Failed to load folders from storage for user:", currentUser.id, error);
        }
        
        // Load sessions
        try {
            const savedSessions = storageService.getItem(sessionKey);
            if (savedSessions) {
                const parsedSessions = JSON.parse(savedSessions);
                if (Array.isArray(parsedSessions) && parsedSessions.length > 0) {
                    setSessions(parsedSessions);
                    setActiveSessionId(parsedSessions[0].id);
                    return; // Exit if sessions loaded
                }
            }
        } catch (error) {
            console.error("Failed to load sessions from storage for user:", currentUser.id, error);
        }
        
        // If no sessions, create a default one
        const newSession = createNewSession();
        setSessions([newSession]);
        setActiveSessionId(newSession.id);

    }, [currentUser, isLoadingAuth]);
    
    // Session saving effect
    useEffect(() => {
        if (!currentUser || isLoadingAuth) return;
        const sessionKey = `justiciaSessions_${currentUser.id}`;
        if (sessions.length > 0) {
             storageService.setItem(sessionKey, JSON.stringify(sessions));
        } else {
             storageService.removeItem(sessionKey);
        }
    }, [sessions, currentUser, isLoadingAuth]);
    
    // Folders saving effect
    useEffect(() => {
        if (!currentUser || isLoadingAuth) return;
        const foldersKey = `justiciaFolders_${currentUser.id}`;
        if (folders.length > 0) {
             storageService.setItem(foldersKey, JSON.stringify(folders));
        } else {
             storageService.removeItem(foldersKey);
        }
    }, [folders, currentUser, isLoadingAuth]);

    useEffect(() => {
        storageService.setItem('justiciaSidebarState', JSON.stringify(isSidebarExpanded));
    }, [isSidebarExpanded]);
    
    const handleLogin = (user: User) => {
        setCurrentUser(user);
    };

    const handleLogout = async () => {
        try {
            const { logOut } = await import('./services/firebaseService');
            await logOut();
            setToastMessage("Successfully signed out.");
        } catch (error) {
            console.error("Logout error:", error);
            setToastMessage("Error signing out. Please try again.");
        }
    };

    const runDocumentAnalysis = useCallback(async (file: File, fileContent: string) => {
        const docType = detectDocumentType(fileContent);
        const stats = getTextStats(fileContent);

        const newSession: ChatSession = {
            id: uuidv4(),
            title: `${docType}: ${file.name}`,
            messages: [],
            createdAt: new Date().toISOString(),
            analysis: null,
            documentName: file.name,
        };

        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        setIsProcessing(true);
        if (isMobile) {
            setIsSidebarExpanded(false);
        }

        try {
            const analysisData = await generateDocumentAnalysis(fileContent, docType);
            
            const fullAnalysisResult: AnalysisResult = {
                docType,
                stats,
                plainLanguageSummary: analysisData.plainLanguageSummary,
                flags: analysisData.flags,
                riskAssessment: {
                    overallSummary: analysisData.aiInsights,
                    risks: analysisData.riskAssessment.risks
                },
                aiInsights: {
                    overallSummary: analysisData.aiInsights,
                    recommendations: []
                }
            };

            // Ajouter le document au système RAG permanent
            const { addDocumentToRAG } = await import('./services/ragService.enhanced');
            await addDocumentToRAG(file.name, fileContent, docType, {
                analysisResult: fullAnalysisResult,
                fileName: file.name,
                fileSize: file.size
            });

            // L'accès permanent est assuré par l'ajout au RAG.
            // Le contexte temporaire de session n'est plus nécessaire.

            const initialUserMessage: Message = {
                id: uuidv4(),
                role: MessageRole.USER,
                content: `Document analysé : "${file.name}" (${Math.round(fileContent.length / 1000)}k caractères)`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            const assistantMessage: Message = {
                 id: uuidv4(),
                 role: MessageRole.ASSISTANT,
                 content: `✅ **Document analysé et intégré à ma base de connaissances !**

**"${file.name}"** est maintenant disponible dans mon système RAG. Je peux :

🔍 **Analyser** le contenu complet du document
📋 **Répondre** à vos questions spécifiques 
📝 **Citer** des passages exacts
⚖️ **Identifier** les risques juridiques
💡 **Proposer** des améliorations

**Posez-moi n'importe quelle question sur ce document !**`,
                 timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            
            // Mettre à jour la session sans le contexte de document temporaire (qui est maintenant dans le RAG)
            setSessions(prev => prev.map(s => 
                s.id === newSession.id 
                ? { ...s, analysis: fullAnalysisResult, messages: [initialUserMessage, assistantMessage], documentContext: null, documentName: null } 
                : s
            ));
        } catch (error) {
            console.error("Document analysis failed:", error);
            const errorMessage: Message = {
                 id: uuidv4(),
                 role: MessageRole.ASSISTANT,
                 content: `Désolé, une erreur s'est produite lors de l'analyse de votre document. Veuillez réessayer. Erreur : ${error instanceof Error ? error.message : String(error)}`,
                 timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
             setSessions(prev => prev.map(s => 
                s.id === newSession.id 
                ? { ...s, messages: [errorMessage] } 
                : s
            ));
        } finally {
            setIsProcessing(false);
        }
    }, [isMobile]);

    const handleFileUpload = useCallback(async (file: File) => {
        console.log('[DEBUG] handleFileUpload called with file:', file);
        if (!file) return;
        try {
            let text = '';
            if (file.type.startsWith('image/')) {
                setToastMessage('Extracting text from image...');
                // Convert image to grayscale using a canvas
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                await new Promise(resolve => { img.onload = resolve; });
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error('Could not get canvas context');
                ctx.drawImage(img, 0, 0);
                // Convert to grayscale
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                for (let i = 0; i < imageData.data.length; i += 4) {
                    const avg = (imageData.data[i] + imageData.data[i+1] + imageData.data[i+2]) / 3;
                    imageData.data[i] = avg;
                    imageData.data[i+1] = avg;
                    imageData.data[i+2] = avg;
                }
                ctx.putImageData(imageData, 0, 0);
                const grayscaleBlob = await new Promise<Blob>((resolve, reject) => {
                    canvas.toBlob(blob => {
                        if (blob) resolve(blob);
                        else reject(new Error('Failed to create grayscale blob'));
                    }, file.type);
                });
                // Run Tesseract with logger and better config
                const { data: { text: ocrText } } = await Tesseract.recognize(grayscaleBlob, 'eng', {
                    logger: (m: any) => {
                        if (m.status === 'recognizing text') {
                            setToastMessage(`OCR Progress: ${Math.round(m.progress * 100)}%`);
                        }
                    },
                    config: { tessedit_pageseg_mode: 6 }
                } as any);
                text = ocrText;
                setToastMessage(null);
            } else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls') || 
                       file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                       file.type === 'application/vnd.ms-excel') {
                // Traitement des fichiers Excel
                setToastMessage('Lecture du fichier Excel...');
                console.log('[DEBUG] Starting Excel extraction');
                
                const excelData = await readExcelFile(file);
                console.log('[DEBUG] Excel data extracted:', excelData);
                
                // Convertir les données Excel en texte pour l'analyse
                text = excelToText(excelData);
                console.log('[DEBUG] Excel converted to text, length:', text.length);
                
                setToastMessage(null);
            } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                setToastMessage('Extracting text from PDF...');
                console.log('[DEBUG] Starting PDF extraction');
                const reader = new FileReader();
                const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
                    reader.onload = () => resolve(reader.result as ArrayBuffer);
                    reader.onerror = reject;
                    reader.readAsArrayBuffer(file);
                });
                console.log('[DEBUG] Got arrayBuffer for PDF, length:', arrayBuffer.byteLength);
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                console.log('[DEBUG] Loaded PDF, numPages:', pdf.numPages);
                let pdfText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    const pageText = content.items.map(item => ('str' in item ? item.str : '')).join(' ');
                    pdfText += pageText + '\n';
                    console.log(`[DEBUG] Extracted text from page ${i}`);
                }
                text = pdfText;
                setToastMessage(null);
            } else {
                // Essayer d'abord l'OCR intelligent pour les images et PDFs scannés
                const ocrResult = await smartExtractText(file);
                if (ocrResult.usedOCR) {
                    text = ocrResult.text;
                    setToastMessage('✨ Texte extrait avec OCR (GPT-4 Vision)');
                    setTimeout(() => setToastMessage(null), 3000);
                } else {
                    text = await extractTextFromFile(file);
                }
            }
            setFullText(text); // Store the original text for highlighting
            const cleanedText = cleanText(text);
            console.log('[DEBUG] Cleaned text:', cleanedText.slice(0, 200));
            
            // Ajouter automatiquement le document à la base de connaissances RAG
            if (cleanedText.trim().length > 0) {
                try {
                    const docType = detectDocumentType(cleanedText);
                    const docId = await addDocumentToRAG(
                        file.name,
                        cleanedText,
                        docType,
                        {
                            uploadDate: new Date().toISOString(),
                            fileSize: file.size,
                            fileType: file.type
                        }
                    );
                    console.log(`[RAG] Document ajouté à la base de connaissances: ${file.name} (ID: ${docId})`);
                    setToastMessage(`Document ajouté à la base de connaissances ✅`);
                    setTimeout(() => setToastMessage(null), 2000);
                } catch (ragError) {
                    console.error('[RAG] Erreur lors de l\'ajout du document:', ragError);
                    // Continuer même si l'ajout RAG échoue
                }
                
                await runDocumentAnalysis(file, cleanedText);
            } else {
                 alert(`File '${file.name}' is empty or could not be read.`);
            }
        } catch(error) {
            setToastMessage(null);
            alert(`Error processing file '${file.name}': ${error instanceof Error ? error.message : 'An unknown error occurred'}`);
            console.error('[DEBUG] Error in handleFileUpload:', error);
        }
    }, [runDocumentAnalysis]);

    const handleDragEnter = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current++;
        if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
        }
    }, []);

    const handleDragLeave = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current--;
        if (dragCounter.current === 0) {
            setIsDragging(false);
        }
    }, []);

    const handleDragOver = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback(async (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        dragCounter.current = 0;
        if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
            for (const file of Array.from(e.dataTransfer.files)) {
                await handleFileUpload(file);
            }
        }
    }, [handleFileUpload]);

    useEffect(() => {
        window.addEventListener('dragenter', handleDragEnter);
        window.addEventListener('dragleave', handleDragLeave);
        window.addEventListener('dragover', handleDragOver);
        window.addEventListener('drop', handleDrop);

        return () => {
            window.removeEventListener('dragenter', handleDragEnter);
            window.removeEventListener('dragleave', handleDragLeave);
            window.removeEventListener('dragover', handleDragOver);
            window.removeEventListener('drop', handleDrop);
        };
    }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

    const activeSession = sessions.find(s => s.id === activeSessionId);

    const updateActiveSession = (updateFn: (session: ChatSession) => ChatSession) => {
        setSessions(prevSessions =>
            prevSessions.map(session =>
                session.id === activeSessionId ? updateFn(session) : session
            )
        );
    };

    const handleSendMessage = useCallback(async (messageContent: string) => {
        if (!activeSessionId) return;
        
        const newMessage: Message = {
            id: uuidv4(),
            role: MessageRole.USER,
            content: messageContent,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        updateActiveSession(session => {
            const isFirstUserMessage = !session.messages.some(m => m.role === MessageRole.USER);
            const newTitle = isFirstUserMessage && session.title === "Nouveau Chat" ? generateTitleFromMessage(messageContent) : session.title;
            const newMessages = [...session.messages, newMessage];
            
            return { ...session, title: newTitle, messages: newMessages };
        });

        setIsProcessing(true);
    }, [activeSessionId]);
    
    const handleReceiveAiMessageChunk = useCallback((chunk: string, isNewMessage: boolean) => {
        updateActiveSession(session => {
            const newMessages = [...session.messages];
            if (isNewMessage) {
                newMessages.push({ 
                    id: uuidv4(), 
                    role: MessageRole.ASSISTANT, 
                    content: chunk,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                });
            } else {
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage && lastMessage.role === MessageRole.ASSISTANT) {
                    lastMessage.content += chunk;
                }
            }
            return { ...session, messages: newMessages };
        });
    }, [activeSessionId]);
    
    // Fonctions pour l'éditeur collaboratif
    const handleEditMessage = useCallback((content: string) => {
        setEditorContent(content);
        setEditorTitle('Modification de Réponse IA');
        setShowCollaborativeEditor(true);
    }, []);

    const handleCreateDocument = useCallback((content: string) => {
        setEditorContent(content);
        setEditorTitle('Nouveau Document Collaboratif');
        setShowCollaborativeEditor(true);
    }, []);

    const handleSaveCollaborativeWork = useCallback((content: string, title?: string) => {
        const document = {
            id: uuidv4(),
            title: title || editorTitle,
            content,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        setCollaborativeDocuments(prev => [...prev, document]);
        
        // Sauvegarder dans le stockage local
        try {
            const existingDocs = JSON.parse(localStorage.getItem('collaborative_documents') || '[]');
            existingDocs.push(document);
            localStorage.setItem('collaborative_documents', JSON.stringify(existingDocs));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
        }
        
        setShowCollaborativeEditor(false);
        setToastMessage(`Document collaboratif sauvegardé avec succès! Total: ${collaborativeDocuments.length + 1} documents`);
    }, [editorTitle]);

    const handleProcessingDone = useCallback(() => {
        setIsProcessing(false);
    }, []);

    const processStream = useCallback(async (currentHistory: Message[]) => {
        let isFirstChunk = true;
        try {
            const geminiHistory = currentHistory.filter(m => m.id !== 'loading');
            
            // Ajouter le contexte d'analyse si disponible
            const activeSession = sessions.find(s => s.id === activeSessionId);
            if (activeSession?.analysis) {
                const latestAnalysis = activeSession.analysis;
                let analysisContext = '\n\n=== ANALYSE DU DOCUMENT ===\n\n';
                
                analysisContext += `Type de document: ${latestAnalysis.detectedDocType || latestAnalysis.docType || 'Non détecté'}\n\n`;
                analysisContext += `Résumé en langage simple:\n${latestAnalysis.plainLanguageSummary || 'Aucun résumé disponible'}\n\n`;
                
                if (latestAnalysis.flags && latestAnalysis.flags.length > 0) {
                    analysisContext += `SIGNALEMENTS DÉTECTÉS (${latestAnalysis.flags.length}):\n`;
                    latestAnalysis.flags.forEach((flag: any, i: number) => {
                        analysisContext += `\n${i + 1}. ${flag.title}\n`;
                        analysisContext += `   Sévérité: ${flag.severity}\n`;
                        analysisContext += `   Clause concernée: ${flag.clause}\n`;
                        analysisContext += `   Explication: ${flag.explanation}\n`;
                        if (flag.suggestedRewrite) {
                            analysisContext += `   Suggestion de reformulation: ${flag.suggestedRewrite}\n`;
                        }
                    });
                    analysisContext += '\n';
                }
                
                if (latestAnalysis.riskAssessment) {
                    analysisContext += `ÉVALUATION DES RISQUES:\n`;
                    analysisContext += `Résumé général: ${latestAnalysis.riskAssessment.overallSummary || 'Non disponible'}\n\n`;
                    if (latestAnalysis.riskAssessment.risks && latestAnalysis.riskAssessment.risks.length > 0) {
                        latestAnalysis.riskAssessment.risks.forEach((risk: any, i: number) => {
                            analysisContext += `${i + 1}. ${risk.area} (Score: ${risk.score}/10)\n`;
                            analysisContext += `   ${risk.assessment}\n\n`;
                        });
                    }
                }
                
                if (latestAnalysis.aiInsights) {
                    analysisContext += `INSIGHTS ET RECOMMANDATIONS:\n`;
                    analysisContext += `Vue d'ensemble: ${latestAnalysis.aiInsights.overallSummary || 'Non disponible'}\n\n`;
                    if (latestAnalysis.aiInsights.recommendations && latestAnalysis.aiInsights.recommendations.length > 0) {
                        latestAnalysis.aiInsights.recommendations.forEach((insight: any, i: number) => {
                            analysisContext += `${i + 1}. ${insight.recommendation}\n`;
                            analysisContext += `   Justification: ${insight.justification}\n\n`;
                        });
                    }
                }
                
                // Ajouter le contexte d'analyse au dernier message utilisateur
                const lastUserMessageIndex = geminiHistory.map(m => m.role).lastIndexOf(MessageRole.USER);
                if (lastUserMessageIndex >= 0) {
                    geminiHistory[lastUserMessageIndex] = {
                        ...geminiHistory[lastUserMessageIndex],
                        content: geminiHistory[lastUserMessageIndex].content + analysisContext
                    };
                }
            }
            
            await streamChatResponse(
                geminiHistory,
                (chunk, isNewMessage) => {
                    handleReceiveAiMessageChunk(chunk, isNewMessage);
                },
                () => {
                    handleProcessingDone();
                }
            );
        } catch (error) {
            console.error("Stream processing error:", error);
            const errorMessage = "Sorry, an error occurred while processing your request.";
            handleReceiveAiMessageChunk(errorMessage, isFirstChunk);
        } finally {
            handleProcessingDone();
        }
    }, [handleReceiveAiMessageChunk, handleProcessingDone]);
    
    useEffect(() => {
        const lastMessage = activeSession?.messages[activeSession.messages.length - 1];
        if (isProcessing && activeSession && lastMessage?.role === MessageRole.USER) {
             processStream(activeSession.messages);
        }
    }, [isProcessing, activeSession, processStream]);

    const handleNewChat = () => {
        const newSession = createNewSession();
        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        if (isMobile) {
            setIsSidebarExpanded(false);
        }
    }

    const handleSwitchSession = (sessionId: string) => {
        setActiveSessionId(sessionId);
         if (isMobile) {
            setIsSidebarExpanded(false);
        }
    }

    const handleDeleteSession = (sessionIdToDelete: string) => {
        const sessionIndex = sessions.findIndex(s => s.id === sessionIdToDelete);
        if (sessionIndex === -1) return;

        const newSessions = sessions.filter(s => s.id !== sessionIdToDelete);

        if (activeSessionId === sessionIdToDelete) {
            if (newSessions.length > 0) {
                const newActiveIndex = Math.max(0, sessionIndex - 1);
                setActiveSessionId(newSessions[newActiveIndex].id);
            } else {
                const newSession = createNewSession();
                setSessions([newSession]);
                setActiveSessionId(newSession.id);
                return;
            }
        }
        
        setSessions(newSessions);
        setToastMessage("Chat deleted successfully.");
    };

    const handleRenameSession = (sessionIdToRename: string, newTitle: string) => {
        setSessions(prev => prev.map(s => s.id === sessionIdToRename ? { ...s, title: newTitle } : s));
        setToastMessage("Chat renamed.");
    };
    
    const handleCreateFolder = (name: string, color: string) => {
        const newFolder: ChatFolder = {
            id: uuidv4(),
            name,
            color,
            createdAt: new Date().toISOString(),
            isExpanded: true,
        };
        setFolders(prev => [...prev, newFolder]);
        setToastMessage("Dossier créé.");
    };
    
    const handleRenameFolder = (folderId: string, newName: string) => {
        setFolders(prev => prev.map(f => f.id === folderId ? { ...f, name: newName } : f));
        setToastMessage("Dossier renommé.");
    };
    
    const handleDeleteFolder = (folderId: string) => {
        // Déplacer toutes les conversations du dossier vers la racine
        setSessions(prev => prev.map(s => s.folderId === folderId ? { ...s, folderId: null } : s));
        setFolders(prev => prev.filter(f => f.id !== folderId));
        setToastMessage("Dossier supprimé.");
    };
    
    const handleToggleFolderExpansion = (folderId: string) => {
        setFolders(prev => prev.map(f => f.id === folderId ? { ...f, isExpanded: !f.isExpanded } : f));
    };
    
    const handleMoveSessionToFolder = (sessionId: string, folderId: string | null) => {
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, folderId } : s));
        setToastMessage(folderId ? "Conversation déplacée dans le dossier." : "Conversation retirée du dossier.");
    };

    const handleToggleSidebar = () => {
        console.log('Toggle sidebar clicked. Current state:', isSidebarExpanded, 'Mobile:', isMobile);
        setIsSidebarExpanded(prev => {
            const newState = !prev;
            console.log('Setting sidebar to:', newState);
            return newState;
        });
    };

    const handleGenerateSummary = async () => {
        if (!activeSession || activeSession.messages.length < 3) {
            alert('Pas assez de messages pour générer une synthèse.');
            return;
        }

        try {
            setIsProcessing(true);
            console.log('[SUMMARY] Génération de la synthèse du chat...');

            // Construire le contexte de conversation
            const conversationText = activeSession.messages
                .map(msg => `${msg.role === MessageRole.USER ? 'Utilisateur' : 'Assistant'}: ${msg.content}`)
                .join('\n\n');

            // Appeler l'API pour générer la synthèse
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `Génère une synthèse complète et professionnelle de cette conversation en français. La synthèse doit inclure :\n\n1. Un résumé exécutif (2-3 paragraphes)\n2. Les points clés discutés\n3. Les questions posées et réponses fournies\n4. Les recommandations ou conclusions principales\n\nConversation:\n${conversationText}`,
                    context: '',
                    sessionId: activeSession.id
                })
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la génération de la synthèse');
            }

            // Lire la réponse en streaming
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let summaryContent = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, { stream: true });
                    summaryContent += chunk;
                }
            }

            console.log('[SUMMARY] Synthèse générée, création du document Word...');

            // Générer le document Word avec en-tête Justicia
            const reportResponse = await fetch('/api/generate-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: {
                        title: 'Synthèse de Conversation',
                        date: new Date().toLocaleDateString('fr-FR'),
                        sections: [{
                            title: 'Synthèse',
                            content: summaryContent
                        }]
                    },
                    headerType: 'justicia'
                })
            });

            if (!reportResponse.ok) {
                throw new Error('Erreur lors de la génération du document');
            }

            // Télécharger le fichier
            const blob = await reportResponse.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `synthese_chat_${new Date().getTime()}.docx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            setToastMessage('✅ Synthèse générée et téléchargée avec succès !');
            console.log('[SUMMARY] Document téléchargé avec succès');
        } catch (error) {
            console.error('[SUMMARY] Erreur:', error);
            alert('Erreur lors de la génération de la synthèse: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
        } finally {
            setIsProcessing(false);
        }
    };
    
    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            for (const file of Array.from(files)) {
                await handleFileUpload(file);
            }
            event.target.value = '';
        }
    };
    
    const renderMainPanelContent = () => {
        if (isProcessing && !activeSession?.analysis) {
            return <AnalysisLoadingView />;
        }
        if (activeSession?.analysis) {
            return (
                <AnalysisResultsView
                    results={activeSession.analysis}
                    fullText={fullText}
                    analyticsOpen={analyticsOpen}
                    onCloseAnalytics={() => setAnalyticsOpen(false)}
                    historyOpen={historyOpen}
                    onCloseHistory={() => setHistoryOpen(false)}
                    activeSessionId={activeSessionId ?? undefined}
                />
            );
        }
        // Always pass onGenerateTemplate to InitialView
        return (
            <InitialView
                onUploadClick={triggerFileUpload}
                onGenerateTemplate={() => setShowTemplateModal(true)}
                onAnalysisComplete={(analysisResult: AnalysisResult, fileName: string) => {
                    console.log('[App] onAnalysisComplete appelé avec:', fileName, analysisResult);
                    
                    // Créer une nouvelle session avec l'analyse
                    const newSession: ChatSession = {
                        id: uuidv4(),
                        title: `Analyse: ${fileName}`,
                        messages: [
                            {
                                id: uuidv4(),
                                role: MessageRole.USER,
                                content: `Document analysé : "${fileName}"`,
                                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            },
                            {
                                id: uuidv4(),
                                role: MessageRole.ASSISTANT,
                                content: `✅ **Document indexé et analysé avec succès !**\n\n**"${fileName}"** est maintenant disponible dans ma base de connaissances. Vous pouvez me poser des questions sur ce document.`,
                                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            }
                        ],
                        createdAt: new Date().toISOString(),
                        analysis: analysisResult,
                        documentName: fileName,
                    };
                    
                    console.log('[App] Nouvelle session créée:', newSession.id);
                    setSessions(prev => [newSession, ...prev]);
                    setActiveSessionId(newSession.id);
                    
                    console.log('[App] Session d\'analyse créée');
                    
                    if (isMobile) {
                        setIsSidebarExpanded(false);
                    }
                }}
            />
        );
    };

    // Helper: always provide a valid ChatSession to ChatPanel
    const getActiveOrDefaultSession = () => {
        if (activeSession) return activeSession;
        return {
            id: 'default',
                title: 'Nouveau Chat',
            messages: [
                {
                    id: 'default-msg',
                    role: MessageRole.ASSISTANT,
                    content: "Bonjour ! Je suis votre assistant IA Justicia. Téléchargez un document ou posez-moi une question pour commencer.",
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            ],
            createdAt: new Date().toISOString(),
            analysis: null,
        };
    };

    if (isLoadingAuth) {
        return (
            <div className="fixed top-0 left-0 w-full h-full bg-neutral-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block mb-6 animate-pulse">
                        <img 
                            src="/justicia-logo.png" 
                            alt="Justicia" 
                            className="h-24 w-auto mx-auto"
                        />
                    </div>
                    <div className="mt-4">
                        <svg className="animate-spin h-8 w-8 text-purple-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-gray-400 mt-4 text-sm">Chargement de Justicia...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        return <LoginPage onLogin={handleLogin} />;
    }

    return (
        <div
            className={`flex h-screen w-screen text-gray-300 bg-transparent font-sans ${!isMobile ? 'overflow-hidden' : ''}`}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
            onDrop={async e => {
                e.preventDefault(); setIsDragging(false);
                if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
                    for (const file of Array.from(e.dataTransfer.files)) {
                        await handleFileUpload(file);
                    }
                }
            }}
        >
            {toastMessage && <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />}
            {isDragging && <DropzoneOverlay />}
             <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".txt,.md,.rtf,.html,.xml,.pdf,.docx,.xlsx,.xls,.jpeg,.jpg,.png"
                multiple
            />

            {showDocumentHistory && (
                <DocumentHistory
                    onClose={() => setShowDocumentHistory(false)}
                    onCreateBlank={() => {
                        setShowDocumentHistory(false);
                        setShowBlankDocumentEditor(true);
                    }}
                    onSelectTemplate={() => {
                        setShowDocumentHistory(false);
                        setShowDocumentTemplateSelector(true);
                    }}
                />
            )}

            {showDocumentTemplateSelector && !selectedTemplate && (
                <DocumentTemplateSelector
                    onSelectTemplate={(template) => {
                        setSelectedTemplate(template);
                    }}
                    onClose={() => setShowDocumentTemplateSelector(false)}
                />
            )}

            {selectedTemplate && (
                <DocumentGenerationForm
                    template={selectedTemplate}
                    onBack={() => setSelectedTemplate(null)}
                    onGenerate={async (data) => {
                        try {
                            const response = await fetch('/api/fill-template', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    templateFilename: selectedTemplate.filename,
                                    data
                                })
                            });

                            if (!response.ok) throw new Error('Erreur génération');

                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = selectedTemplate.filename.replace('.docx', '_rempli.docx');
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            window.URL.revokeObjectURL(url);

                            // Ajouter à l'historique
                            addDocumentToHistory({
                                type: 'template',
                                title: selectedTemplate.name,
                                description: selectedTemplate.description,
                                fileName: `${selectedTemplate.name}.docx`,
                                fileUrl: url,
                                metadata: {
                                    templateName: selectedTemplate.name
                                }
                            });

                            setSelectedTemplate(null);
                            setShowDocumentTemplateSelector(false);
                            setToastMessage('Document généré avec succès !');
                        } catch (error) {
                            console.error('Erreur:', error);
                            alert('Erreur lors de la génération du document');
                        }
                    }}
                />
            )}

            {showBlankDocumentEditor && (
                <BlankDocumentEditor
                    onBack={() => setShowBlankDocumentEditor(false)}
                    onGenerate={async (title, content) => {
                        try {
                            const response = await fetch('/api/generate-blank-document', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ title, content })
                            });

                            if (!response.ok) throw new Error('Erreur génération');

                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.docx`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            window.URL.revokeObjectURL(url);

                            // Ajouter à l'historique
                            addDocumentToHistory({
                                type: 'template',
                                title: title,
                                description: 'Document vierge avec en-tête Porteo',
                                fileName: `${title}.docx`,
                                fileUrl: url,
                                metadata: {
                                    templateName: 'Document vierge'
                                }
                            });

                            setShowBlankDocumentEditor(false);
                            setToastMessage('Document généré avec succès !');
                        } catch (error) {
                            console.error('Erreur:', error);
                            alert('Erreur lors de la génération du document');
                        }
                    }}
                />
            )}

            {showTemplateModal && (
                <div className="fixed inset-0 z-[10000] bg-black">
                    <div className="h-full flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
                            <h2 className="text-xl font-bold text-white">Modèles de Documents</h2>
                            <button
                                onClick={() => setShowTemplateModal(false)}
                                className="p-2 hover:bg-neutral-800 rounded-lg transition text-white"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <TemplateGallery 
                                onClose={() => setShowTemplateModal(false)}
                                onSelectTemplate={(template) => {
                                    // Générer le document avec l'IA
                                    const prompt = `Génère un ${template.name} professionnel et complet en français. ${template.description}. Utilise un format juridique formel avec toutes les clauses nécessaires.`;
                                    handleSendMessage(prompt);
                                    setShowTemplateModal(false);
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
            {/* Hamburger menu always visible on mobile */}
            {isMobile && !isSidebarExpanded && (
                <button
                    onClick={handleToggleSidebar}
                    className="fixed top-4 left-4 z-50 p-2 bg-black/60 rounded-md text-gray-200 hover:bg-black/80 md:hidden"
                    aria-label="Toggle sidebar"
                >
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            )}
            {/* On mobile, only show sidebar or chat, not both */}
            {isMobile ? (
                isSidebarExpanded ? (
                    <Sidebar 
                        user={currentUser}
                        onLogout={handleLogout}
                        sessions={sessions}
                        folders={folders}
                        activeSessionId={activeSessionId}
                        onNewChat={handleNewChat}
                        onSwitchSession={handleSwitchSession}
                        onDeleteSession={handleDeleteSession}
                        onRenameSession={handleRenameSession}
                        onCreateFolder={handleCreateFolder}
                        onRenameFolder={handleRenameFolder}
                        onDeleteFolder={handleDeleteFolder}
                        onToggleFolderExpansion={handleToggleFolderExpansion}
                        onMoveSessionToFolder={handleMoveSessionToFolder}
                        isExpanded={isSidebarExpanded}
                        onToggle={handleToggleSidebar}
                        isMobile={isMobile}
                        onShowAnalytics={() => setAnalyticsOpen(true)}
                        onShowHistory={() => setHistoryOpen(true)}
                        onShowReportGenerator={() => setShowTemplateModal(true)}
                        onShowDocumentEditor={() => {
                            setEditorContent('');
                            setEditorTitle('Nouveau Document');
                            setShowCollaborativeEditor(true);
                        }}
                        onShowDocumentsList={() => {
                            setShowDocumentHistory(true);
                        }}
                        onShowRAGSpace={() => setShowKnowledgeBase(true)}
                        onShowShare={() => {
                            // Fonctionnalité de partage à implémenter
                            alert('Fonctionnalité de partage à venir');
                        }}
                        onShowAccount={() => setShowAccountSettings(true)}
                        onShowSettings={() => setShowAppSettings(true)}
                        onShowVoiceChat={() => {
                            // Créer un contexte enrichi avec le document et l'analyse complète
                            let context = '';
                            
                            // 1. Texte du document
                            if (fullText) {
                                context += `=== DOCUMENT UPLOADÉ ===\n${fullText}\n\n`;
                            }
                            
                            // 2. Analyse complète si disponible
                            const activeSession = sessions.find(s => s.id === activeSessionId);
                            if (activeSession?.analysis) {
                                const latestAnalysis = activeSession.analysis;
                                
                                context += `=== ANALYSE DU DOCUMENT ===\n\n`;
                                
                                // Type et résumé
                                context += `Type de document: ${latestAnalysis.detectedDocType || latestAnalysis.docType || 'Non détecté'}\n\n`;
                                context += `Résumé en langage simple:\n${latestAnalysis.plainLanguageSummary || 'Aucun résumé disponible'}\n\n`;
                                
                                // Signalements (flags)
                                if (latestAnalysis.flags && latestAnalysis.flags.length > 0) {
                                    context += `SIGNALEMENTS DÉTECTÉS (${latestAnalysis.flags.length}):\n`;
                                    latestAnalysis.flags.forEach((flag: any, i: number) => {
                                        context += `\n${i + 1}. ${flag.title}\n`;
                                        context += `   Sévérité: ${flag.severity}\n`;
                                        context += `   Clause concernée: ${flag.clause}\n`;
                                        context += `   Explication: ${flag.explanation}\n`;
                                        if (flag.suggestedRewrite) {
                                            context += `   Suggestion de reformulation: ${flag.suggestedRewrite}\n`;
                                        }
                                    });
                                    context += `\n`;
                                }
                                
                                // Évaluation des risques
                                if (latestAnalysis.riskAssessment) {
                                    context += `ÉVALUATION DES RISQUES:\n`;
                                    context += `Résumé général: ${latestAnalysis.riskAssessment.overallSummary || 'Non disponible'}\n\n`;
                                    if (latestAnalysis.riskAssessment.risks && latestAnalysis.riskAssessment.risks.length > 0) {
                                        latestAnalysis.riskAssessment.risks.forEach((risk: any, i: number) => {
                                            context += `${i + 1}. ${risk.area} (Score: ${risk.score}/10)\n`;
                                            context += `   ${risk.assessment}\n\n`;
                                        });
                                    }
                                }
                                
                                // Insights et recommandations de l'IA
                                if (latestAnalysis.aiInsights) {
                                    context += `INSIGHTS ET RECOMMANDATIONS:\n`;
                                    context += `Vue d'ensemble: ${latestAnalysis.aiInsights.overallSummary || 'Non disponible'}\n\n`;
                                    if (latestAnalysis.aiInsights.recommendations && latestAnalysis.aiInsights.recommendations.length > 0) {
                                        latestAnalysis.aiInsights.recommendations.forEach((insight: any, i: number) => {
                                            context += `${i + 1}. ${insight.recommendation}\n`;
                                            context += `   Justification: ${insight.justification}\n\n`;
                                        });
                                    }
                                }
                                
                                // Statistiques du document
                                if (latestAnalysis.stats) {
                                    context += `STATISTIQUES:\n`;
                                    context += `- Mots: ${latestAnalysis.stats.words}\n`;
                                    context += `- Caractères: ${latestAnalysis.stats.characters}\n`;
                                    context += `- Phrases: ${latestAnalysis.stats.sentences}\n`;
                                    context += `- Temps de lecture estimé: ${latestAnalysis.stats.readingTime} min\n\n`;
                                }
                            }
                            
                            setVoiceChatContext(context);
                            setShowVoiceChat(true);
                        }}
                    />
                ) : (
                    activeSession && (
                        <ChatPanel
                            session={activeSession}
                            isProcessing={isProcessing}
                            onSendMessage={handleSendMessage}
                            onUploadClick={triggerFileUpload}
                            onToggleSidebar={handleToggleSidebar}
                            isMobile={true}
                            onViewAnalysis={() => setAnalysisModalOpen(true)}
                            onShowVoiceChat={() => setShowVoiceChat(true)}
                            onShowTemplates={() => setShowDocumentTemplateSelector(true)}
                            onEditMessage={handleEditMessage}
                            user={currentUser}
                            onCreateDocument={handleCreateDocument}
                            onGenerateSummary={handleGenerateSummary}
                        />
                    )
                )
            ) : (
                // Desktop/tablet layout
                <>
                    <Sidebar 
                        user={currentUser}
                        onLogout={handleLogout}
                        sessions={sessions}
                        folders={folders}
                        activeSessionId={activeSessionId}
                        onNewChat={handleNewChat}
                        onSwitchSession={handleSwitchSession}
                        onDeleteSession={handleDeleteSession}
                        onRenameSession={handleRenameSession}
                        onCreateFolder={handleCreateFolder}
                        onRenameFolder={handleRenameFolder}
                        onDeleteFolder={handleDeleteFolder}
                        onToggleFolderExpansion={handleToggleFolderExpansion}
                        onMoveSessionToFolder={handleMoveSessionToFolder}
                        isExpanded={isSidebarExpanded}
                        onToggle={handleToggleSidebar}
                        isMobile={isMobile}
                        onShowAnalytics={() => setAnalyticsOpen(true)}
                        onShowHistory={() => setHistoryOpen(true)}
                        onShowReportGenerator={() => setShowTemplateModal(true)}
                        onShowDocumentEditor={() => {
                            setEditorContent('');
                            setEditorTitle('Nouveau Document');
                            setShowCollaborativeEditor(true);
                        }}
                        onShowDocumentsList={() => {
                            setShowDocumentHistory(true);
                        }}
                        onShowRAGSpace={() => setShowKnowledgeBase(true)}
                        onShowShare={() => {
                            // Fonctionnalité de partage à implémenter
                            alert('Fonctionnalité de partage à venir');
                        }}
                        onShowAccount={() => setShowAccountSettings(true)}
                        onShowSettings={() => setShowAppSettings(true)}
                        onShowVoiceChat={() => {
                            // Créer un contexte enrichi avec le document et l'analyse complète
                            let context = '';
                            
                            // 1. Texte du document
                            if (fullText) {
                                context += `=== DOCUMENT UPLOADÉ ===\n${fullText}\n\n`;
                            }
                            
                            // 2. Analyse complète si disponible
                            const activeSession = sessions.find(s => s.id === activeSessionId);
                            if (activeSession?.analysis) {
                                const latestAnalysis = activeSession.analysis;
                                
                                context += `=== ANALYSE DU DOCUMENT ===\n\n`;
                                
                                // Type et résumé
                                context += `Type de document: ${latestAnalysis.detectedDocType || latestAnalysis.docType || 'Non détecté'}\n\n`;
                                context += `Résumé en langage simple:\n${latestAnalysis.plainLanguageSummary || 'Aucun résumé disponible'}\n\n`;
                                
                                // Signalements (flags)
                                if (latestAnalysis.flags && latestAnalysis.flags.length > 0) {
                                    context += `SIGNALEMENTS DÉTECTÉS (${latestAnalysis.flags.length}):\n`;
                                    latestAnalysis.flags.forEach((flag: any, i: number) => {
                                        context += `\n${i + 1}. ${flag.title}\n`;
                                        context += `   Sévérité: ${flag.severity}\n`;
                                        context += `   Clause concernée: ${flag.clause}\n`;
                                        context += `   Explication: ${flag.explanation}\n`;
                                        if (flag.suggestedRewrite) {
                                            context += `   Suggestion de reformulation: ${flag.suggestedRewrite}\n`;
                                        }
                                    });
                                    context += `\n`;
                                }
                                
                                // Évaluation des risques
                                if (latestAnalysis.riskAssessment) {
                                    context += `ÉVALUATION DES RISQUES:\n`;
                                    context += `Résumé général: ${latestAnalysis.riskAssessment.overallSummary || 'Non disponible'}\n\n`;
                                    if (latestAnalysis.riskAssessment.risks && latestAnalysis.riskAssessment.risks.length > 0) {
                                        latestAnalysis.riskAssessment.risks.forEach((risk: any, i: number) => {
                                            context += `${i + 1}. ${risk.area} (Score: ${risk.score}/10)\n`;
                                            context += `   ${risk.assessment}\n\n`;
                                        });
                                    }
                                }
                                
                                // Insights et recommandations de l'IA
                                if (latestAnalysis.aiInsights) {
                                    context += `INSIGHTS ET RECOMMANDATIONS:\n`;
                                    context += `Vue d'ensemble: ${latestAnalysis.aiInsights.overallSummary || 'Non disponible'}\n\n`;
                                    if (latestAnalysis.aiInsights.recommendations && latestAnalysis.aiInsights.recommendations.length > 0) {
                                        latestAnalysis.aiInsights.recommendations.forEach((insight: any, i: number) => {
                                            context += `${i + 1}. ${insight.recommendation}\n`;
                                            context += `   Justification: ${insight.justification}\n\n`;
                                        });
                                    }
                                }
                                
                                // Statistiques du document
                                if (latestAnalysis.stats) {
                                    context += `STATISTIQUES:\n`;
                                    context += `- Mots: ${latestAnalysis.stats.words}\n`;
                                    context += `- Caractères: ${latestAnalysis.stats.characters}\n`;
                                    context += `- Phrases: ${latestAnalysis.stats.sentences}\n`;
                                    context += `- Temps de lecture estimé: ${latestAnalysis.stats.readingTime} min\n\n`;
                                }
                            }
                            
                            setVoiceChatContext(context);
                            setShowVoiceChat(true);
                        }}
                    />
                    <main className="flex-1 flex flex-col overflow-hidden bg-neutral-900 transition-all duration-300">
                        <div className="flex-1 flex flex-col items-start overflow-y-auto bg-neutral-900">
                            <div className="w-full p-4 sm:p-6 lg:p-8 animate-fadeIn">
                                {renderMainPanelContent()}
                            </div>
                            <div className="w-full">
                                <ChatPanel 
                                    session={getActiveOrDefaultSession()}
                                    isProcessing={isProcessing}
                                    onSendMessage={handleSendMessage}
                                    onUploadClick={triggerFileUpload}
                                    onToggleSidebar={handleToggleSidebar}
                                    isMobile={false}
                                    onEditMessage={handleEditMessage}
                                    onShowVoiceChat={() => setShowVoiceChat(true)}
                                    onShowTemplates={() => setShowDocumentTemplateSelector(true)}
                                    onCreateDocument={handleCreateDocument}
                                    user={currentUser}
                                    onGenerateSummary={handleGenerateSummary}
                                />
                            </div>
                        </div>
                    </main>
                </>
            )}
            {isAnalysisModalOpen && (
                <AnalysisModal onClose={() => setAnalysisModalOpen(false)}>
                    {activeSession?.analysis && <AnalysisResultsView results={activeSession.analysis} fullText={fullText} />}
                </AnalysisModal>
            )}
            {showCollaborativeEditor && (
                <CollaborativeEditor
                    initialContent={editorContent}
                    title={editorTitle}
                    onSave={handleSaveCollaborativeWork}
                    onClose={() => setShowCollaborativeEditor(false)}
                    onShowVoiceChat={(context, onTranscript) => {
                        setVoiceChatContext(context || '');
                        setShowVoiceChat(true);
                    }}
                />
            )}
            {showVoiceChat && (
                <VoiceChat
                    context={voiceChatContext}
                    onClose={() => setShowVoiceChat(false)}
                    user={currentUser}
                    onSaveConversation={(messages) => {
                        // Ajouter les messages de la conversation vocale au chat actuel
                        const conversationText = messages.map(msg => `${msg.role === MessageRole.USER ? 'Vous' : 'Assistant'}: ${msg.content}`).join('\n\n');
                        if (conversationText && activeSession) {
                            handleSendMessage(conversationText);
                        }
                    }}
                />
            )}
            {showKnowledgeBase && (
                <KnowledgeBaseManager
                    onClose={() => setShowKnowledgeBase(false)}
                />
            )}
            {showAccountSettings && (
                <AccountSettings
                    user={currentUser}
                    onClose={() => setShowAccountSettings(false)}
                    onUpdateProfile={(updates) => {
                        // Mettre à jour le profil utilisateur
                        const updatedUser = { ...currentUser, ...updates };
                        setCurrentUser(updatedUser);
                        // Sauvegarder dans localStorage
                        localStorage.setItem('justiciaUser', JSON.stringify(updatedUser));
                        console.log('Profil mis à jour:', updatedUser);
                    }}
                    onDeleteAccount={() => {
                        // Supprimer le compte
                        console.log('Suppression du compte');
                        // TODO: Implémenter la suppression du compte
                    }}
                />
            )}
            {showAppSettings && (
                <AppSettingsComponent
                    currentSettings={appSettings}
                    onClose={() => setShowAppSettings(false)}
                    onUpdateSettings={(newSettings) => {
                        setAppSettings(newSettings);
                        // Sauvegarder dans localStorage
                        localStorage.setItem('justiciaAppSettings', JSON.stringify(newSettings));
                    }}
                />
            )}
        </div>
    );
};

export default App;