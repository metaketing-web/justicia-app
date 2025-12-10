import React from 'react';
import { ChatSession } from '../types';
import ChatInput from './ChatInput';
import ChatView from './ChatView';
import { MenuIcon, DocumentChatIcon } from '../constants';

interface ChatPanelProps {
    session: ChatSession;
    isProcessing: boolean;
    onSendMessage: (content: string) => void;
    onUploadClick: () => void;
    onToggleSidebar: () => void;
    isMobile: boolean;
    onViewAnalysis?: () => void;
    onEditMessage?: (content: string) => void;
    onCreateDocument?: (content: string) => void;
    onShowVoiceChat?: () => void;
    onShowTemplates?: () => void;
    onGenerateSummary?: () => void;
    user?: { username: string; avatarUrl?: string };
}

const ChatPanel: React.FC<ChatPanelProps> = ({ session, isProcessing, onSendMessage, onUploadClick, onToggleSidebar, isMobile, onViewAnalysis, onEditMessage, onCreateDocument, onShowVoiceChat, onShowTemplates, onGenerateSummary, user }) => {
    
    const showViewAnalysisButton = isMobile && session.analysis && onViewAnalysis;

    return (
        <div className="flex-1 flex flex-col h-full max-h-screen overflow-hidden">
            <header className={`border-b border-neutral-800/50 flex justify-between items-center flex-shrink-0 bg-black/30 backdrop-blur-xl relative glass-pane z-10 ${isMobile ? 'px-4 py-3' : 'p-3 sm:p-4'}`}>
                <div className={`flex items-center min-w-0 flex-1 ${isMobile ? 'gap-3' : 'gap-2 sm:gap-3'}`}> 
                    {/* Sidebar toggle button (hamburger) - only on mobile */}
                    {isMobile && (
                        <button onClick={onToggleSidebar} className="p-2 text-gray-400 hover:text-white rounded-md hover:bg-neutral-700 md:hidden flex-shrink-0">
                            <MenuIcon className="w-6 h-6" />
                        </button>
                    )}
                    <div className="flex-1 min-w-0">
                        <h2 className="text-base sm:text-lg font-semibold text-gray-200 truncate" title={session?.documentName || session?.title}>
                            {session?.documentName || session?.title || 'Nouveau Chat'}
                        </h2>
                        <p className="text-xs text-gray-400 hidden sm:block">Analyse de documents par JusticIA</p>
                    </div>
                </div>
                 {showViewAnalysisButton && (
                    <button 
                        onClick={onViewAnalysis}
                        className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm ml-2 sm:ml-4 px-2 sm:px-3 py-1.5 bg-justicia-gradient/20 text-justicia-gradient font-semibold rounded-lg hover:bg-justicia-gradient/30 transition-colors flex-shrink-0"
                    >
                        <DocumentChatIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Voir le Rapport</span>
                        <span className="sm:hidden">Rapport</span>
                    </button>
                 )}
            </header>

            {/* Zone de chat avec meilleur espacement */}
            <div className={`flex-1 overflow-y-auto min-h-0 scrollbar-custom animate-fadeIn ${isMobile ? 'px-4 pt-4 pb-2' : 'px-6 py-6 md:px-12 md:py-8'} pb-24`} style={{ scrollbarGutter: 'stable' }}>
                <ChatView
                    key={session.id}
                    session={session}
                    isProcessing={isProcessing}
                    onEditMessage={onEditMessage}
                    onCreateDocument={onCreateDocument}
                    user={user}
                />
            </div>

            {/* Bouton synthèse du chat */}
            {session && session.messages.length > 3 && onGenerateSummary && (
                <div className="px-6 py-3 border-t border-neutral-800/50 bg-black/20 backdrop-blur-xl flex justify-center">
                    <button
                        onClick={onGenerateSummary}
                        disabled={isProcessing}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 hover:from-purple-700 hover:via-pink-600 hover:to-orange-600 text-white font-medium rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        title={isProcessing ? "Document en cours de téléchargement..." : "Générer une synthèse du chat"}
                    >
                        {isProcessing ? (
                            <>
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Téléchargement en cours...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>Synthèse du chat</span>
                            </>
                        )}
                    </button>
                </div>
            )}
            
            {/* Zone de saisie avec meilleur espacement */}
            <div className={`border-t border-neutral-800/50 flex-shrink-0 bg-black/30 backdrop-blur-xl relative glass-pane z-10 ${isMobile ? 'px-4 py-4 mb-2' : 'px-6 py-5 md:px-12'}`}>
                <ChatInput
                    onSubmit={onSendMessage}
                    isLoading={isProcessing}
                    onUploadClick={onUploadClick}
                    hasStartedChat={!!session && session.messages.length > 1}
                    isMobile={isMobile}
                    onShowVoiceChat={onShowVoiceChat}
                    onShowTemplates={onShowTemplates}
                />
            </div>
        </div>
    )
}


export default ChatPanel;