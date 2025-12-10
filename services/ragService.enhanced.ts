/**
 * Service RAG amélioré avec stockage persistant et embeddings vectoriels
 * Permet de stocker des documents de manière persistante et d'effectuer des recherches sémantiques
 */

import { indexedDBService, StoredDocument, StoredEmbedding } from './indexedDBService';
import { embeddingService } from './embeddingService';

export interface RAGDocument {
    id: string;
    name: string;
    content: string;
    chunks: string[];
    uploadDate: Date;
    type: string;
    metadata?: {
        wordCount?: number;
        charCount?: number;
        sentenceCount?: number;
        analysisResult?: any;
    };
}

export interface RAGSearchResult {
    chunk: string;
    similarity: number;
    source: string;
    documentId: string;
    chunkIndex: number;
}

export interface RAGContext {
    relevantChunks: RAGSearchResult[];
    sourceDocuments: string[];
    confidence: number;
    totalDocuments: number;
}

class EnhancedRAGService {
    private isInitialized: boolean = false;

    /**
     * Initialiser le service RAG
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            console.log('[RAG Enhanced] Initialisation du service RAG...');
            // IndexedDB s'initialise automatiquement
            this.isInitialized = true;
            console.log('[RAG Enhanced] Service RAG initialisé avec succès');
        } catch (error) {
            console.error('[RAG Enhanced] Erreur lors de l\'initialisation:', error);
            throw error;
        }
    }

    /**
     * Diviser le document en chunks pour un meilleur traitement
     */
    private chunkDocument(content: string, chunkSize: number = 4000): string[] {
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

    /**
     * Vérifier si un document existe déjà (par nom ou contenu similaire)
     */
    async checkDuplicate(name: string, content: string): Promise<{ exists: boolean; existingDoc?: StoredDocument }> {
        await this.initialize();

        try {
            const allDocs = await indexedDBService.getAllDocuments();
            
            // Vérifier par nom exact
            const exactMatch = allDocs.find(doc => doc.name === name);
            if (exactMatch) {
                return { exists: true, existingDoc: exactMatch };
            }

            // Vérifier par contenu similaire (même longueur et premiers 500 caractères)
            const contentPreview = content.substring(0, 500);
            const similarDoc = allDocs.find(doc => {
                const docPreview = doc.content.substring(0, 500);
                return doc.content.length === content.length && docPreview === contentPreview;
            });

            if (similarDoc) {
                return { exists: true, existingDoc: similarDoc };
            }

            return { exists: false };
        } catch (error) {
            console.error('[RAG Enhanced] Erreur lors de la vérification des doublons:', error);
            return { exists: false };
        }
    }

    /**
     * Ajouter un document à la base de connaissances
     */
    async addDocument(
        name: string,
        content: string,
        type: string = 'text',
        metadata?: any
    ): Promise<string> {
        await this.initialize();

        try {
            const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            const chunks = this.chunkDocument(content);

            // Créer le document
            const document: StoredDocument = {
                id,
                name,
                content,
                chunks,
                uploadDate: new Date().toISOString(),
                type,
                metadata: {
                    wordCount: content.split(/\s+/).length,
                    charCount: content.length,
                    sentenceCount: content.split(/[.!?]+/).length,
                    ...metadata
                }
            };

            // Sauvegarder le document
            await indexedDBService.saveDocument(document);
            console.log(`[RAG Enhanced] Document sauvegardé: ${name} (${chunks.length} chunks)`);

            // Générer les embeddings pour chaque chunk
            // TEMPORAIREMENT DÉSACTIVÉ : L'API Manus ne supporte pas les embeddings
            // console.log(`[RAG Enhanced] Génération des embeddings pour ${chunks.length} chunks...`);
            // const embeddingResults = await embeddingService.generateEmbeddingsBatch(chunks);

            // Sauvegarder les embeddings
            // for (let i = 0; i < embeddingResults.length; i++) {
            //     const storedEmbedding: StoredEmbedding = {
            //         id: `${id}-${i}`,
            //         documentId: id,
            //         chunkIndex: i,
            //         embedding: embeddingResults[i].embedding,
            //         chunk: chunks[i]
            //     };
            //     await indexedDBService.saveEmbedding(storedEmbedding);
            // }

            console.log(`[RAG Enhanced] Document ajouté avec succès: ${name}`);
            return id;
        } catch (error) {
            console.error('[RAG Enhanced] Erreur lors de l\'ajout du document:', error);
            throw error;
        }
    }

    /**
     * Rechercher dans la base de connaissances avec recherche sémantique
     */
    async searchDocuments(query: string, maxResults: number = 5): Promise<RAGContext> {
        await this.initialize();

        try {
            // Générer l'embedding de la requête
            const queryEmbeddingResult = await embeddingService.generateEmbedding(query);
            const queryEmbedding = queryEmbeddingResult.embedding;

            // Récupérer tous les embeddings
            const allEmbeddings = await indexedDBService.getAllEmbeddings();

            if (allEmbeddings.length === 0) {
                return {
                    relevantChunks: [],
                    sourceDocuments: [],
                    confidence: 0,
                    totalDocuments: 0
                };
            }

            // Calculer la similarité pour chaque embedding
            const similarities = allEmbeddings.map(storedEmbedding => ({
                similarity: embeddingService.cosineSimilarity(queryEmbedding, storedEmbedding.embedding),
                embedding: storedEmbedding
            }));

            // Trier par similarité décroissante
            similarities.sort((a, b) => b.similarity - a.similarity);

            // Prendre les top K résultats
            const topResults = similarities.slice(0, maxResults);

            // Récupérer les informations des documents sources
            const documentIds = new Set(topResults.map(r => r.embedding.documentId));
            const documents = await Promise.all(
                Array.from(documentIds).map(id => indexedDBService.getDocument(id))
            );
            const documentMap = new Map(documents.filter(d => d !== null).map(d => [d!.id, d!]));

            // Construire les résultats
            const relevantChunks: RAGSearchResult[] = topResults.map(result => ({
                chunk: result.embedding.chunk,
                similarity: result.similarity,
                source: documentMap.get(result.embedding.documentId)?.name || 'Unknown',
                documentId: result.embedding.documentId,
                chunkIndex: result.embedding.chunkIndex
            }));

            const sourceDocuments = Array.from(new Set(relevantChunks.map(r => r.source)));
            const confidence = topResults.length > 0 ? topResults[0].similarity : 0;

            console.log(`[RAG Enhanced] Recherche effectuée: ${relevantChunks.length} résultats trouvés`);

            return {
                relevantChunks,
                sourceDocuments,
                confidence,
                totalDocuments: documentMap.size
            };
        } catch (error) {
            console.error('[RAG Enhanced] Erreur lors de la recherche:', error);
            throw error;
        }
    }

    /**
     * Obtenir le contexte complet pour une question
     */
    async getContextForQuery(query: string, maxResults: number = 5): Promise<string> {
        const context = await this.searchDocuments(query, maxResults);
        
        if (context.relevantChunks.length === 0) {
            return "Aucun document pertinent trouvé dans la base de connaissances.";
        }

        let contextText = `📚 CONTEXTE DE LA BASE DE CONNAISSANCES\n`;
        contextText += `Sources: ${context.sourceDocuments.join(', ')}\n`;
        contextText += `Confiance: ${(context.confidence * 100).toFixed(1)}%\n`;
        contextText += `Total de documents: ${context.totalDocuments}\n\n`;
        
        context.relevantChunks.forEach((result, index) => {
            contextText += `[Extrait ${index + 1} - ${result.source} - Similarité: ${(result.similarity * 100).toFixed(1)}%]\n`;
            contextText += `${result.chunk}\n\n`;
        });

        return contextText;
    }

    /**
     * Récupérer tous les documents
     */
    async getAllDocuments(): Promise<RAGDocument[]> {
        await this.initialize();
        const storedDocs = await indexedDBService.getAllDocuments();
        return storedDocs.map(doc => ({
            ...doc,
            uploadDate: new Date(doc.uploadDate)
        }));
    }

    /**
     * Récupérer un document par son ID
     */
    async getDocument(id: string): Promise<RAGDocument | null> {
        await this.initialize();
        const doc = await indexedDBService.getDocument(id);
        if (!doc) return null;
        return {
            ...doc,
            uploadDate: new Date(doc.uploadDate)
        };
    }

    /**
     * Supprimer un document
     */
    async removeDocument(id: string): Promise<boolean> {
        await this.initialize();
        try {
            await indexedDBService.deleteDocument(id);
            console.log(`[RAG Enhanced] Document supprimé: ${id}`);
            return true;
        } catch (error) {
            console.error('[RAG Enhanced] Erreur lors de la suppression du document:', error);
            return false;
        }
    }

    /**
     * Vider complètement la base de connaissances
     */
    async clearAll(): Promise<void> {
        await this.initialize();
        await indexedDBService.clearAll();
        embeddingService.clearCache();
        console.log('[RAG Enhanced] Base de connaissances vidée');
    }

    /**
     * Obtenir les statistiques de la base de connaissances
     */
    async getStats(): Promise<{
        documentCount: number;
        embeddingCount: number;
        totalChunks: number;
        cacheSize: number;
    }> {
        await this.initialize();
        const dbStats = await indexedDBService.getStats();
        const cacheStats = embeddingService.getCacheStats();
        const documents = await this.getAllDocuments();
        const totalChunks = documents.reduce((sum, doc) => sum + doc.chunks.length, 0);

        return {
            documentCount: dbStats.documentCount,
            embeddingCount: dbStats.embeddingCount,
            totalChunks,
            cacheSize: cacheStats.size
        };
    }

    /**
     * Vérifier si des documents sont disponibles
     */
    async hasDocuments(): Promise<boolean> {
        await this.initialize();
        const docs = await indexedDBService.getAllDocuments();
        return docs.length > 0;
    }

    /**
     * Recherche hybride (sémantique + mots-clés)
     */
    async hybridSearch(query: string, maxResults: number = 5): Promise<RAGContext> {
        await this.initialize();

        // Recherche sémantique
        const semanticResults = await this.searchDocuments(query, maxResults * 2);

        // Recherche par mots-clés
        const queryLower = query.toLowerCase();
        const queryWords = new Set(queryLower.split(/\s+/).filter(w => w.length > 2));

        // Calculer un score hybride
        const hybridScores = semanticResults.relevantChunks.map(result => {
            const chunkLower = result.chunk.toLowerCase();
            const chunkWords = new Set(chunkLower.split(/\s+/).filter(w => w.length > 2));

            // Score de mots-clés
            let keywordScore = 0;
            for (const word of queryWords) {
                if (chunkWords.has(word)) {
                    keywordScore++;
                }
            }
            keywordScore = keywordScore / Math.max(queryWords.size, 1);

            // Score hybride (70% sémantique, 30% mots-clés)
            const hybridScore = result.similarity * 0.7 + keywordScore * 0.3;

            return {
                ...result,
                similarity: hybridScore
            };
        });

        // Trier par score hybride
        hybridScores.sort((a, b) => b.similarity - a.similarity);

        // Prendre les top K
        const topResults = hybridScores.slice(0, maxResults);

        return {
            relevantChunks: topResults,
            sourceDocuments: Array.from(new Set(topResults.map(r => r.source))),
            confidence: topResults.length > 0 ? topResults[0].similarity : 0,
            totalDocuments: semanticResults.totalDocuments
        };
    }
}

// Instance globale du service RAG amélioré
export const enhancedRAGService = new EnhancedRAGService();

// Fonctions utilitaires
export const addDocumentToRAG = (
    name: string,
    content: string,
    type?: string,
    metadata?: any
): Promise<string> => {
    return enhancedRAGService.addDocument(name, content, type, metadata);
};

export const searchRAG = (query: string, maxResults?: number): Promise<string> => {
    return enhancedRAGService.getContextForQuery(query, maxResults);
};

export const hybridSearchRAG = (query: string, maxResults?: number): Promise<RAGContext> => {
    return enhancedRAGService.hybridSearch(query, maxResults);
};

export const getAllRAGDocuments = (): Promise<RAGDocument[]> => {
    return enhancedRAGService.getAllDocuments();
};

export const removeRAGDocument = (id: string): Promise<boolean> => {
    return enhancedRAGService.removeDocument(id);
};

export const clearRAG = (): Promise<void> => {
    return enhancedRAGService.clearAll();
};

export const getRAGStats = () => {
    return enhancedRAGService.getStats();
};

export const hasRAGDocuments = (): Promise<boolean> => {
    return enhancedRAGService.hasDocuments();
};

export const checkRAGDuplicate = (name: string, content: string): Promise<{ exists: boolean; existingDoc?: StoredDocument }> => {
    return enhancedRAGService.checkDuplicate(name, content);
};

export default enhancedRAGService;

