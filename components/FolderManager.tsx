import React, { useState, useRef, useEffect } from 'react';
import { ChatFolder, ChatSession } from '../types';
import { FolderIcon, FolderOpenIcon, PencilIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon, PlusIcon } from '../constants';

interface FolderManagerProps {
    folders: ChatFolder[];
    sessions: ChatSession[];
    activeSessionId: string | null;
    isExpanded: boolean;
    onCreateFolder: (name: string, color: string) => void;
    onRenameFolder: (id: string, newName: string) => void;
    onDeleteFolder: (id: string) => void;
    onToggleFolderExpansion: (id: string) => void;
    onSwitchSession: (id: string) => void;
    onDeleteSession: (id: string) => void;
    onRenameSession: (id: string, newTitle: string) => void;
    onMoveSessionToFolder: (sessionId: string, folderId: string | null) => void;
}

const FOLDER_COLORS = [
    { name: 'Vert', value: '#10b981' },
    { name: 'Bleu', value: '#3b82f6' },
    { name: 'Violet', value: '#8b5cf6' },
    { name: 'Rose', value: '#ec4899' },
    { name: 'Orange', value: '#f59e0b' },
    { name: 'Rouge', value: '#ef4444' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Indigo', value: '#6366f1' },
];

const FolderItem: React.FC<{
    folder: ChatFolder;
    sessions: ChatSession[];
    activeSessionId: string | null;
    isExpanded: boolean;
    onRename: (newName: string) => void;
    onDelete: () => void;
    onToggle: () => void;
    onSwitchSession: (id: string) => void;
    onDeleteSession: (id: string) => void;
    onRenameSession: (id: string, newTitle: string) => void;
    onDrop: (sessionId: string) => void;
}> = ({ folder, sessions, activeSessionId, isExpanded, onRename, onDelete, onToggle, onSwitchSession, onDeleteSession, onRenameSession, onDrop }) => {
    const [isRenaming, setIsRenaming] = useState(false);
    const [name, setName] = useState(folder.name);
    const [isDragOver, setIsDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setName(folder.name);
    }, [folder.name]);

    useEffect(() => {
        if (isRenaming && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isRenaming]);

    const handleRenameSubmit = () => {
        if (name.trim()) {
            onRename(name.trim());
        } else {
            setName(folder.name);
        }
        setIsRenaming(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleRenameSubmit();
        if (e.key === 'Escape') {
            setName(folder.name);
            setIsRenaming(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        
        const sessionId = e.dataTransfer.getData('sessionId');
        if (sessionId) {
            onDrop(sessionId);
        }
    };

    const folderSessions = sessions.filter(s => s.folderId === folder.id);
    const FolderIconComponent = folder.isExpanded ? FolderOpenIcon : FolderIcon;

    return (
        <div className="mb-2">
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`group relative flex items-center justify-between p-2.5 rounded-lg text-sm transition-all duration-300 cursor-pointer border ${
                    isDragOver 
                        ? 'bg-neutral-700/80 border-justicia-gradient/80 shadow-[0_0_20px_rgba(29,185,84,0.3)]'
                        : 'text-gray-400 border-transparent hover:bg-neutral-800/50 hover:text-gray-200 hover:border-justicia-gradient/30'
                }`}
            >
                <div className="flex items-center gap-2 flex-1 min-w-0" onClick={() => !isRenaming && onToggle()}>
                    {folder.isExpanded ? (
                        <ChevronDownIcon className="w-4 h-4 flex-shrink-0" />
                    ) : (
                        <ChevronRightIcon className="w-4 h-4 flex-shrink-0" />
                    )}
                    <FolderIconComponent 
                        className="w-4 h-4 flex-shrink-0" 
                        style={{ color: folder.color || '#9ca3af' }}
                    />
                    {isRenaming ? (
                        <input
                            ref={inputRef}
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={handleRenameSubmit}
                            onKeyDown={handleKeyDown}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 bg-transparent border-0 ring-1 ring-spotify rounded p-0 m-0 text-white text-sm focus:ring-2 focus:outline-none"
                        />
                    ) : (
                        <span className="truncate font-medium">
                            {folder.name} ({folderSessions.length})
                        </span>
                    )}
                </div>

                {isExpanded && !isRenaming && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={(e) => {e.stopPropagation(); setIsRenaming(true)}} 
                            className="p-1 hover:text-white"
                        >
                            <PencilIcon className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={(e) => {e.stopPropagation(); onDelete()}} 
                            className="p-1 hover:text-red-500"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {folder.isExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                    {folderSessions.map(session => (
                        <SessionItem
                            key={session.id}
                            session={session}
                            isActive={activeSessionId === session.id}
                            isExpanded={isExpanded}
                            onSwitch={() => onSwitchSession(session.id)}
                            onDelete={() => onDeleteSession(session.id)}
                            onRename={(newTitle) => onRenameSession(session.id, newTitle)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const SessionItem: React.FC<{
    session: ChatSession;
    isActive: boolean;
    isExpanded: boolean;
    onSwitch: () => void;
    onDelete: () => void;
    onRename: (newTitle: string) => void;
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
            setTitle(session.title);
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

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('sessionId', session.id);
        e.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div
            draggable={!isRenaming}
            onDragStart={handleDragStart}
            onClick={() => !isRenaming && onSwitch()}
            className={`group relative flex items-center justify-between p-2.5 rounded-lg text-sm truncate transition-all duration-300 cursor-pointer border ${
                isActive 
                    ? 'bg-neutral-700/80 font-semibold text-white border-justicia-gradient/80 animate-glow' 
                    : 'text-gray-400 border-transparent hover:bg-neutral-800/50 hover:text-gray-200 hover:border-justicia-gradient/30 hover:shadow-[0_0_20px_rgba(29,185,84,0.15)] hover:-translate-y-0.5'
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
                    <button onClick={(e) => {e.stopPropagation(); setIsRenaming(true)}} className="p-1 hover:text-white">
                        <PencilIcon className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => {e.stopPropagation(); onDelete()}} className="p-1 hover:text-red-500">
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
};

const FolderManager: React.FC<FolderManagerProps> = ({
    folders,
    sessions,
    activeSessionId,
    isExpanded,
    onCreateFolder,
    onRenameFolder,
    onDeleteFolder,
    onToggleFolderExpansion,
    onSwitchSession,
    onDeleteSession,
    onRenameSession,
    onMoveSessionToFolder,
}) => {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0].value);
    const [isDragOverRoot, setIsDragOverRoot] = useState(false);

    const handleCreateFolder = () => {
        if (newFolderName.trim()) {
            onCreateFolder(newFolderName.trim(), selectedColor);
            setNewFolderName('');
            setSelectedColor(FOLDER_COLORS[0].value);
            setShowCreateModal(false);
        }
    };

    const handleDragOverRoot = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOverRoot(true);
    };

    const handleDragLeaveRoot = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOverRoot(false);
    };

    const handleDropRoot = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOverRoot(false);
        
        const sessionId = e.dataTransfer.getData('sessionId');
        if (sessionId) {
            onMoveSessionToFolder(sessionId, null);
        }
    };

    // Sessions sans dossier
    const rootSessions = sessions.filter(s => !s.folderId);

    return (
        <div className="flex-1 overflow-y-auto h-full pr-1 -mr-2">
            {/* Bouton créer dossier */}
            <div className="flex items-center justify-between px-2.5 pb-2">
                <p className={`text-xs text-gray-500 font-semibold uppercase tracking-wider ${!isExpanded ? 'text-center' : ''}`}>
                    {isExpanded ? 'Dossiers' : 'Doss'}
                </p>
                {isExpanded && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="p-1 hover:bg-neutral-800/50 rounded transition-colors"
                        title="Créer un dossier"
                    >
                        <PlusIcon className="w-4 h-4 text-gray-400 hover:text-white" />
                    </button>
                )}
            </div>

            <nav className="space-y-1">
                {/* Dossiers */}
                {folders.map(folder => (
                    <FolderItem
                        key={folder.id}
                        folder={folder}
                        sessions={sessions}
                        activeSessionId={activeSessionId}
                        isExpanded={isExpanded}
                        onRename={(newName) => onRenameFolder(folder.id, newName)}
                        onDelete={() => onDeleteFolder(folder.id)}
                        onToggle={() => onToggleFolderExpansion(folder.id)}
                        onSwitchSession={onSwitchSession}
                        onDeleteSession={onDeleteSession}
                        onRenameSession={onRenameSession}
                        onDrop={(sessionId) => onMoveSessionToFolder(sessionId, folder.id)}
                    />
                ))}

                {/* Zone de dépôt pour retirer des dossiers */}
                {rootSessions.length > 0 && folders.length > 0 && (
                    <div className="pt-2 border-t border-neutral-800/50">
                        <p className="px-2.5 pb-2 text-xs text-gray-500 font-semibold uppercase tracking-wider">
                            Sans dossier
                        </p>
                    </div>
                )}

                {/* Sessions sans dossier */}
                <div
                    onDragOver={handleDragOverRoot}
                    onDragLeave={handleDragLeaveRoot}
                    onDrop={handleDropRoot}
                    className={`space-y-1 ${isDragOverRoot ? 'bg-neutral-800/30 rounded-lg p-2' : ''}`}
                >
                    {rootSessions.map(session => (
                        <SessionItem
                            key={session.id}
                            session={session}
                            isActive={activeSessionId === session.id}
                            isExpanded={isExpanded}
                            onSwitch={() => onSwitchSession(session.id)}
                            onDelete={() => onDeleteSession(session.id)}
                            onRename={(newTitle) => onRenameSession(session.id, newTitle)}
                        />
                    ))}
                </div>
            </nav>

            {/* Modal de création de dossier */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[10000]" onClick={() => setShowCreateModal(false)}>
                    <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 w-96 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-4">Créer un dossier</h3>
                        
                        <div className="mb-4">
                            <label className="block text-sm text-gray-400 mb-2">Nom du dossier</label>
                            <input
                                type="text"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-justicia-gradient"
                                placeholder="Mon dossier"
                                autoFocus
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm text-gray-400 mb-2">Couleur</label>
                            <div className="grid grid-cols-4 gap-2">
                                {FOLDER_COLORS.map(color => (
                                    <button
                                        key={color.value}
                                        onClick={() => setSelectedColor(color.value)}
                                        className={`w-full h-10 rounded-lg border-2 transition-all ${
                                            selectedColor === color.value 
                                                ? 'border-white scale-110' 
                                                : 'border-transparent hover:scale-105'
                                        }`}
                                        style={{ backgroundColor: color.value }}
                                        title={color.name}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 px-4 py-2 rounded-lg border border-neutral-700 text-gray-400 hover:bg-neutral-800 transition"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleCreateFolder}
                                disabled={!newFolderName.trim()}
                                className="flex-1 px-4 py-2 rounded-lg bg-justicia-gradient text-white font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Créer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FolderManager;
