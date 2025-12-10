import React, { useState, useRef, useEffect } from 'react';
import { ChatSession, User, ChatFolder } from '../types';
import FolderManager from './FolderManager';
import { PlusIcon, PencilIcon, TrashIcon } from '../constants';
import UserMenu from './UserMenu';


interface SidebarProps {
    sessions: ChatSession[];
    folders: ChatFolder[];
    activeSessionId: string | null;
    isExpanded: boolean;
    onNewChat: () => void;
    onSwitchSession: (id: string) => void;
    onDeleteSession: (id: string) => void;
    onRenameSession: (id: string, newTitle: string) => void;
    onCreateFolder: (name: string, color: string) => void;
    onRenameFolder: (id: string, newName: string) => void;
    onDeleteFolder: (id: string) => void;
    onToggleFolderExpansion: (id: string) => void;
    onMoveSessionToFolder: (sessionId: string, folderId: string | null) => void;
    onToggle: () => void;
    user: User;
    onLogout: () => void;
    isMobile: boolean;
    onShowAnalytics?: () => void;
    onShowHistory?: () => void;
    onShowVoiceChat?: () => void;
    onShowReportGenerator?: () => void;
    onShowDocumentEditor?: () => void;
    onShowDocumentsList?: () => void;
    onShowRAGSpace?: () => void;
    onShowShare?: () => void;
    onShowAccount?: () => void;
    onShowSettings?: () => void;
}

const SessionItem: React.FC<{
    session: ChatSession,
    isActive: boolean,
    isExpanded: boolean,
    onSwitch: () => void,
    onDelete: () => void,
    onRename: (newTitle: string) => void,
}> = ({ session, isActive, isExpanded, onSwitch, onDelete, onRename }) => {
    const [isRenaming, setIsRenaming] = useState(false);
    const [title, setTitle] = useState(session.title);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setTitle(session.title);
    }, [session.title]);
    
    useEffect(() => {
        if (isRenaming && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isRenaming]);
    
    const handleRenameSubmit = () => {
        if (title.trim()) {
            onRename(title.trim());
        } else {
            setTitle(session.title); // revert if empty
        }
        setIsRenaming(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleRenameSubmit();
        if (e.key === 'Escape') {
            setTitle(session.title);
            setIsRenaming(false);
        }
    };
    
    return (
        <div
            onClick={() => !isRenaming && onSwitch()}
            className={`group relative flex items-center justify-between p-2.5 rounded-lg text-sm truncate transition-all duration-300 cursor-pointer border ${
                isActive ? 'bg-neutral-700/80 font-semibold text-white border-justicia-gradient/80 animate-glow' : 'text-gray-400 border-transparent hover:bg-neutral-800/50 hover:text-gray-200 hover:border-justicia-gradient/30 hover:shadow-[0_0_20px_rgba(29,185,84,0.15)] hover:-translate-y-0.5'
            }`}
        >
            {isRenaming ? (
                 <input
                    ref={inputRef}
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleRenameSubmit}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-transparent border-0 ring-1 ring-spotify rounded p-0 m-0 text-white text-sm focus:ring-2 focus:outline-none"
                />
            ) : (
                <span className={`truncate transition-opacity duration-200 ${!isExpanded && 'opacity-0 md:opacity-100'}`}>
                    {session.title}
                </span>
            )}

            {isExpanded && !isRenaming && isActive && (
                <div className="absolute right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-700/80">
                    <button onClick={(e) => {e.stopPropagation(); setIsRenaming(true)}} className="p-1 hover:text-white"><PencilIcon className="w-4 h-4" /></button>
                    <button onClick={(e) => {e.stopPropagation(); onDelete()}} className="p-1 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                </div>
            )}
        </div>
    );
};

const Sidebar: React.FC<SidebarProps> = ({ sessions, folders, activeSessionId, isExpanded, onNewChat, onSwitchSession, onDeleteSession, onRenameSession, onCreateFolder, onRenameFolder, onDeleteFolder, onToggleFolderExpansion, onMoveSessionToFolder, onToggle, user, onLogout, isMobile, onShowAnalytics, onShowHistory, onShowVoiceChat, onShowReportGenerator, onShowDocumentEditor, onShowDocumentsList, onShowRAGSpace, onShowShare, onShowAccount, onShowSettings }) => {
    return (
        <>
            {/* Overlay for mobile */}
            <div
                className={`fixed inset-0 bg-black/60 z-30 transition-opacity duration-300 ${isMobile ? (isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none') : 'hidden'}`}
                onClick={() => { if (isMobile && isExpanded) onToggle(); }}
            ></div>
        
            <div className={`
                relative glass-pane
                bg-black/40 backdrop-blur-2xl border-r border-white/10
                flex flex-col h-screen 
                transition-all duration-300 ease-in-out z-[9999]
                ${isMobile 
                    ? isExpanded 
                        ? 'fixed left-0 top-0 w-80 translate-x-0 transform' // restore original width and remove debug bg
                        : 'fixed left-0 top-0 w-0 -translate-x-full transform'
                    : `${isExpanded ? 'w-64' : 'w-20'} mt-6` // mt-6 for desktop only
                }
                ${!isMobile && 'p-2'}
                ${isMobile && isExpanded && 'p-4'}
            `}>
                {/* Logo JUSTICIA en haut - Cliquable pour retourner à l'accueil */}
                <button 
                    onClick={onNewChat}
                    className={`flex items-center p-3 mb-4 hover:bg-gray-800/30 rounded-lg transition-all ${isExpanded ? 'justify-start' : 'justify-center'} w-full`}
                    title="Retour à l'accueil"
                >
                    <img 
                        src="/justicialogoapplication.png" 
                        alt="Justicia" 
                        className={`${isExpanded ? 'h-12' : 'h-9'} w-auto transition-all duration-300`}
                    />
                </button>
                {/* Only show New Chat button if sidebar is expanded (open) on mobile, or always on desktop */}
                {(!isMobile || (isMobile && isExpanded)) && (
                    <button
                        onClick={onNewChat}
                        className={`flex items-center w-full p-2.5 my-2 rounded-lg text-sm font-medium text-gray-200 bg-neutral-800 hover:bg-neutral-700/80 transition-all hover:-translate-y-0.5 ${isExpanded ? 'justify-between' : 'justify-center'}`}
                    >
                        <span className={`${!isExpanded && 'md:hidden'}`}>Nouveau Chat</span>
                        <PlusIcon className="w-4 h-4" />
                    </button>
                )}
                
                {/* Bouton Documents */}
                {(!isMobile || (isMobile && isExpanded)) && onShowDocumentsList && (
                    <button
                        onClick={onShowDocumentsList}
                        className="flex items-center w-full p-2.5 my-2 rounded-lg text-sm font-medium text-gray-200 bg-neutral-800 hover:bg-neutral-700/80 transition-all hover:-translate-y-0.5"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className={`flex-1 text-left ${!isExpanded && 'md:hidden'}`}>Mes Documents</span>
                    </button>
                )}
                
                <FolderManager
                    folders={folders}
                    sessions={sessions}
                    activeSessionId={activeSessionId}
                    isExpanded={isExpanded}
                    onCreateFolder={onCreateFolder}
                    onRenameFolder={onRenameFolder}
                    onDeleteFolder={onDeleteFolder}
                    onToggleFolderExpansion={onToggleFolderExpansion}
                    onSwitchSession={onSwitchSession}
                    onDeleteSession={onDeleteSession}
                    onRenameSession={onRenameSession}
                    onMoveSessionToFolder={onMoveSessionToFolder}
                />

                <footer className="mt-auto pt-2 border-t border-neutral-800">
                    <UserMenu 
                        user={user}
                        onLogout={onLogout}
                        onShowVoiceChat={onShowVoiceChat}
                        onShowReportGenerator={onShowReportGenerator}
                        onShowDocumentEditor={onShowDocumentEditor}
                        onShowRAGSpace={onShowRAGSpace}
                        onShowAccount={onShowAccount}
                        onShowSettings={onShowSettings}
                    />
                </footer>
            </div>
        </>
    );
};

export default Sidebar;
