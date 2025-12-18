import React, { useState } from 'react';
import { Message, MessageRole } from '../types';
import { JusticiaIcon, UserIcon, CopyIcon, CheckIcon, SpeakerIcon } from '../constants';
import JusticiaLoader from './JusticiaLoader';
import { Edit3, FileText, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// Style de coloration syntaxique inline
import { speakTextWithOpenAI, stopSpeakingOpenAI } from '../services/openai-tts.service';

interface ChatMessageProps {
    message: Message;
    isLoading?: boolean;
    className?: string;
    onEditMessage?: (content: string) => void;
    onCreateDocument?: (content: string) => void;
    user?: { username: string; avatarUrl?: string };
}

const LoadingIndicator: React.FC = () => (
    <div className="flex items-center justify-center py-4">
        <JusticiaLoader size="medium" text="" />
    </div>
);

const CodeCopyButton: React.FC<{ text: string }> = ({ text }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    return (
        <button
            onClick={handleCopy}
            className="absolute top-3 right-3 p-2 rounded-md bg-gray-700/80 text-gray-300 hover:bg-gray-600 hover:text-white transition-all text-xs font-medium"
            aria-label="Copy code"
        >
            {isCopied ? (
                <span className="flex items-center gap-1.5">
                    <CheckIcon className="w-3.5 h-3.5 text-green-400" />
                    Copié
                </span>
            ) : (
                <span className="flex items-center gap-1.5">
                    <CopyIcon className="w-3.5 h-3.5" />
                    Copier
                </span>
            )}
        </button>
    );
};

const MessageContent: React.FC<{ content: string }> = ({ content }) => {
     return (
        <div className="prose prose-lg prose-invert max-w-none
                        prose-p:text-gray-200 prose-p:leading-relaxed prose-p:mb-4
                        prose-headings:text-white prose-headings:font-semibold prose-headings:mb-3 prose-headings:mt-6
                        prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                        prose-strong:text-white prose-strong:font-semibold
                        prose-ul:my-4 prose-ul:space-y-2 prose-li:text-gray-200
                        prose-ol:my-4 prose-ol:space-y-2
                        prose-a:text-blue-400 prose-a:underline hover:prose-a:text-blue-300
                        prose-code:text-purple-300 prose-code:bg-gray-800/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                        prose-blockquote:border-l-purple-500 prose-blockquote:bg-gray-800/30 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:my-4
                        prose-pre:bg-transparent prose-pre:p-0 prose-pre:m-0">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        const codeText = String(children).replace(/\n$/, '');
                        return !inline && match ? (
                            <div className="relative my-4 rounded-lg overflow-hidden border border-gray-700">
                                <CodeCopyButton text={codeText} />
                                <SyntaxHighlighter
                                    customStyle={{
                                      backgroundColor: '#1e1e1e',
                                      margin: 0,
                                      padding: '1.25rem',
                                      fontSize: '14px',
                                      lineHeight: '1.6',
                                      borderRadius: '0.5rem'
                                    }}
                                    language={match[1]}
                                    PreTag="div"
                                >
                                    {codeText}
                                </SyntaxHighlighter>
                             </div>
                        ) : (
                            <code className="bg-gray-800/70 text-purple-300 rounded px-1.5 py-0.5 text-sm font-mono" {...props}>
                                {children}
                            </code>
                        );
                    },
                    p({ children }) {
                        return <p className="mb-4 last:mb-0 text-base leading-7">{children}</p>;
                    },
                    ul({ children }) {
                        return <ul className="space-y-2 my-4">{children}</ul>;
                    },
                    ol({ children }) {
                        return <ol className="space-y-2 my-4">{children}</ol>;
                    },
                    li({ children }) {
                        return <li className="text-gray-200 leading-relaxed">{children}</li>;
                    },
                    h1({ children }) {
                        return <h1 className="text-2xl font-semibold text-white mb-3 mt-6">{children}</h1>;
                    },
                    h2({ children }) {
                        return <h2 className="text-xl font-semibold text-white mb-3 mt-5">{children}</h2>;
                    },
                    h3({ children }) {
                        return <h3 className="text-lg font-semibold text-white mb-2 mt-4">{children}</h3>;
                    },
                    blockquote({ children }) {
                        return (
                            <blockquote className="border-l-4 border-purple-500 bg-gray-800/30 py-3 px-4 my-4 rounded-r">
                                {children}
                            </blockquote>
                        );
                    }
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLoading = false, className = '', onEditMessage, onCreateDocument, user }) => {
    const isAssistant = message.role === MessageRole.ASSISTANT;
    const [isSpeaking, setIsSpeaking] = useState(false);

    const handleDownloadWord = async (content: string) => {
        try {
            // Importer le service de génération Word
            const { generateChatSummaryDocument } = await import('../services/wordDocumentService');
            
            // Générer et télécharger le document Word avec en-tête Justicia
            await generateChatSummaryDocument(
                'Synthèse de conversation',
                content,
                `synthese_justicia_${new Date().getTime()}.docx`
            );
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de la génération du document Word');
        }
    };

    const handleListen = () => {
        if (isSpeaking) {
            stopSpeakingOpenAI();
            setIsSpeaking(false);
        } else {
            speakTextWithOpenAI(message.content, () => setIsSpeaking(false), 'alloy');
            setIsSpeaking(true);
        }
    };

    return (
        <div className={`group flex items-start gap-4 mb-8 ${className}`}>
            {/* Avatar */}
            <div className="flex-shrink-0 mt-1">
                {isAssistant ? (
                    <div className="w-8 h-8 flex items-center justify-center">
                        <img src="/justicia-avatar.png" alt="Justicia" className="w-8 h-8" />
                    </div>
                ) : (
                    user?.avatarUrl ? (
                        <img 
                            src={user.avatarUrl} 
                            alt={user.username || 'Utilisateur'} 
                            className="w-8 h-8 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                            <UserIcon />
                        </div>
                    )
                )}
            </div>

            {/* Message Content */}
            <div className="flex-1 min-w-0">
                {/* Role Label */}
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-400">
                        {isAssistant ? 'Justicia' : (user?.username || 'Vous')}
                    </span>
                    {message.timestamp && (
                        <span className="text-xs text-gray-600">
                            {message.timestamp}
                        </span>
                    )}
                </div>

                {/* Message Bubble */}
                <div className={`rounded-2xl px-6 py-4 ${
                    isAssistant 
                        ? 'bg-gray-800/50 border border-gray-700/50' 
                        : 'bg-gray-700/50 border border-gray-600/50'
                }`}>
                    {isLoading ? (
                        <LoadingIndicator />
                    ) : (
                        <MessageContent content={message.content} />
                    )}
                </div>

                {/* Action Buttons */}
                {isAssistant && !isLoading && (
                    <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => onEditMessage?.(message.content)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 transition"
                            title="Ouvrir l'éditeur collaboratif"
                        >
                            <Edit3 className="w-3.5 h-3.5" />
                            Modifier
                        </button>

                        <button
                            onClick={handleListen}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/30 transition ${
                                isSpeaking ? 'bg-purple-500/20' : ''
                            }`}
                            title={isSpeaking ? 'Arrêter' : 'Écouter'}
                        >
                            <SpeakerIcon className="w-3.5 h-3.5" />
                            {isSpeaking ? 'Arrêter' : 'Écouter'}
                        </button>
                        <button
                            onClick={() => handleDownloadWord(message.content)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/30 transition"
                            title="Télécharger en Word avec papier à en-tête PORTEO"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Word
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatMessage;
