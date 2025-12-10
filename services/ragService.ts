interface RAGDocument {
    id: string;
    name: string;
    content: string;
    chunks: string[];
    embeddings?: number[][];
    uploadDate: Date;
    type: string;
}

interface RAGContext {
    relevantChunks: string[];
    sourceDocuments: string[];
    confidence: number;
}

class RAGService {
    private documents: Map<string, RAGDocument> = new Map();
    private currentSessionDocuments: Set<string> = new Set();

    // Ajouter un document au dataset RAG
    addDocument(name: string, content: string, type: string = 'text'): string {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const chunks = this.chunkDocument(content);
        
        const document: RAGDocument = {
            id,
            name,
            content,
            chunks,
            uploadDate: new Date(),
            type
        };

        this.documents.set(id, document);
        this.currentSessionDocuments.add(id);
        
        console.log(`[RAG] Document ajouté: ${name} (${chunks.length} chunks)`);
        return id;
    }

    // Diviser le document en chunks pour un meilleur traitement
    private chunkDocument(content: string, chunkSize: number = 1000): string[] {
        const chunks: string[] = [];
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        let currentChunk = '';
        for (const sentence of sentences) {
            if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
                chunks.push(currentChunk.trim());
                currentChunk = sentence.trim();
            } else {
                currentChunk += (currentChunk ? '. ' : '') + sentence.trim();
            }
        }
        
        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
        }
        
        return chunks.length > 0 ? chunks : [content];
    }

    // Rechercher dans les documents avec similarité textuelle simple
    searchDocuments(query: string, maxResults: number = 5): RAGContext {
        const queryLower = query.toLowerCase();
        const relevantChunks: { chunk: string; score: number; source: string }[] = [];

        // Rechercher dans tous les documents de la session courante
        for (const docId of this.currentSessionDocuments) {
            const document = this.documents.get(docId);
            if (!document) continue;

            for (const chunk of document.chunks) {
                const score = this.calculateSimilarity(queryLower, chunk.toLowerCase());
                if (score > 0.1) { // Seuil de pertinence
                    relevantChunks.push({
                        chunk,
                        score,
                        source: document.name
                    });
                }
            }
        }

        // Trier par score de pertinence
        relevantChunks.sort((a, b) => b.score - a.score);
        const topChunks = relevantChunks.slice(0, maxResults);

        return {
            relevantChunks: topChunks.map(item => item.chunk),
            sourceDocuments: [...new Set(topChunks.map(item => item.source))],
            confidence: topChunks.length > 0 ? topChunks[0].score : 0
        };
    }

    // Calcul de similarité simple basé sur les mots communs
    private calculateSimilarity(query: string, text: string): number {
        const queryWords = new Set(query.split(/\s+/).filter(w => w.length > 2));
        const textWords = new Set(text.split(/\s+/).filter(w => w.length > 2));
        
        let commonWords = 0;
        for (const word of queryWords) {
            if (textWords.has(word)) {
                commonWords++;
            }
        }
        
        // Bonus pour les correspondances exactes de phrases
        const queryPhrases = query.split(/[.!?]+/).filter(p => p.trim().length > 10);
        let phraseBonus = 0;
        for (const phrase of queryPhrases) {
            if (text.includes(phrase.trim())) {
                phraseBonus += 0.3;
            }
        }
        
        const similarity = (commonWords / Math.max(queryWords.size, 1)) + phraseBonus;
        return Math.min(similarity, 1);
    }

    // Obtenir le contexte complet pour une question
    getContextForQuery(query: string): string {
        const context = this.searchDocuments(query);
        
        if (context.relevantChunks.length === 0) {
            return "Aucun document pertinent trouvé dans la base de connaissances.";
        }

        let contextText = `CONTEXTE DOCUMENTAIRE (Sources: ${context.sourceDocuments.join(', ')}):\n\n`;
        
        context.relevantChunks.forEach((chunk, index) => {
            contextText += `[Extrait ${index + 1}]\n${chunk}\n\n`;
        });

        return contextText;
    }

    // Obtenir tous les documents de la session
    getCurrentSessionDocuments(): RAGDocument[] {
        return Array.from(this.currentSessionDocuments)
            .map(id => this.documents.get(id))
            .filter(doc => doc !== undefined) as RAGDocument[];
    }

    // Nettoyer la session courante
    clearCurrentSession(): void {
        this.currentSessionDocuments.clear();
        console.log('[RAG] Session nettoyée');
    }

    // Obtenir les statistiques
    getStats(): { totalDocuments: number; sessionDocuments: number; totalChunks: number } {
        const sessionDocs = this.getCurrentSessionDocuments();
        const totalChunks = sessionDocs.reduce((sum, doc) => sum + doc.chunks.length, 0);
        
        return {
            totalDocuments: this.documents.size,
            sessionDocuments: this.currentSessionDocuments.size,
            totalChunks
        };
    }

    // Supprimer un document
    removeDocument(id: string): boolean {
        const removed = this.documents.delete(id);
        this.currentSessionDocuments.delete(id);
        return removed;
    }

    // Vérifier si des documents sont disponibles
    hasDocuments(): boolean {
        return this.currentSessionDocuments.size > 0;
    }

    // Obtenir le contenu complet d'un document
    getDocumentContent(id: string): string | null {
        const doc = this.documents.get(id);
        return doc ? doc.content : null;
    }

    // Recherche avancée avec filtres
    advancedSearch(query: string, documentTypes?: string[], dateRange?: { start: Date; end: Date }): RAGContext {
        const queryLower = query.toLowerCase();
        const relevantChunks: { chunk: string; score: number; source: string }[] = [];

        for (const docId of this.currentSessionDocuments) {
            const document = this.documents.get(docId);
            if (!document) continue;

            // Filtrer par type si spécifié
            if (documentTypes && !documentTypes.includes(document.type)) continue;

            // Filtrer par date si spécifié
            if (dateRange && (document.uploadDate < dateRange.start || document.uploadDate > dateRange.end)) continue;

            for (const chunk of document.chunks) {
                const score = this.calculateSimilarity(queryLower, chunk.toLowerCase());
                if (score > 0.1) {
                    relevantChunks.push({
                        chunk,
                        score,
                        source: document.name
                    });
                }
            }
        }

        relevantChunks.sort((a, b) => b.score - a.score);
        const topChunks = relevantChunks.slice(0, 10);

        return {
            relevantChunks: topChunks.map(item => item.chunk),
            sourceDocuments: [...new Set(topChunks.map(item => item.source))],
            confidence: topChunks.length > 0 ? topChunks[0].score : 0
        };
    }
}

// Instance globale du service RAG
export const ragService = new RAGService();

// Fonctions utilitaires
export const addDocumentToRAG = (name: string, content: string, type?: string): string => {
    return ragService.addDocument(name, content, type);
};

export const searchRAG = (query: string): string => {
    return ragService.getContextForQuery(query);
};

export const clearRAGSession = (): void => {
    ragService.clearCurrentSession();
};

export const getRAGStats = () => {
    return ragService.getStats();
};

export const hasRAGDocuments = (): boolean => {
    return ragService.hasDocuments();
};

export default ragService;
