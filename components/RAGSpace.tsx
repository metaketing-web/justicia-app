import React from 'react';
import KnowledgeBaseManager from './KnowledgeBaseManager';

interface RAGSpaceProps {
    onClose: () => void;
}

/**
 * Composant RAGSpace - wrapper pour KnowledgeBaseManager
 * Maintient la compatibilité avec l'ancien code
 */
const RAGSpace: React.FC<RAGSpaceProps> = ({ onClose }) => {
    return <KnowledgeBaseManager onClose={onClose} />;
};

export default RAGSpace;

