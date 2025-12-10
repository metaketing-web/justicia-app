/**
 * Service de génération d'embeddings vectoriels via le backend
 * Utilise le modèle text-embedding-3-small pour des embeddings de haute qualité
 */

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536; // Dimensions du modèle text-embedding-3-small

export interface EmbeddingResult {
    embedding: number[];
    text: string;
    model: string;
    dimensions: number;
}

class EmbeddingService {
    private model: string;
    private cache: Map<string, number[]> = new Map();

    constructor(model: string = EMBEDDING_MODEL) {
        this.model = model;
    }

    /**
     * Générer un embedding pour un texte donné
     */
    async generateEmbedding(text: string): Promise<EmbeddingResult> {
        // Vérifier le cache
        const cacheKey = this.getCacheKey(text);
        if (this.cache.has(cacheKey)) {
            console.log('[Embedding] Utilisation du cache pour:', text.substring(0, 50) + '...');
            return {
                embedding: this.cache.get(cacheKey)!,
                text,
                model: this.model,
                dimensions: EMBEDDING_DIMENSIONS
            };
        }

        try {
            const response = await fetch('/api/embeddings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    input: text
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Embeddings API error: ${error.error || response.statusText}`);
            }

            const data = await response.json();
            if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
                // Retourner un embedding vide au lieu de lancer une erreur
                console.warn('[Embedding] API ne supporte pas les embeddings, retour d\'un vecteur vide');
                const emptyEmbedding = new Array(EMBEDDING_DIMENSIONS).fill(0);
                return {
                    embedding: emptyEmbedding,
                    text,
                    model: this.model,
                    dimensions: EMBEDDING_DIMENSIONS
                };
            }
            const embedding = data.data[0].embedding;

            // Mettre en cache
            this.cache.set(cacheKey, embedding);

            console.log(`[Embedding] Embedding généré pour: ${text.substring(0, 50)}... (${embedding.length} dimensions)`);

            return {
                embedding,
                text,
                model: this.model,
                dimensions: embedding.length
            };
        } catch (error) {
            console.error('[Embedding] Erreur lors de la génération de l\'embedding:', error);
            throw error;
        }
    }

    /**
     * Générer des embeddings pour plusieurs textes en batch
     */
    async generateEmbeddingsBatch(texts: string[]): Promise<EmbeddingResult[]> {
        // Filtrer les textes déjà en cache
        const uncachedTexts = texts.filter(text => !this.cache.has(this.getCacheKey(text)));
        
        if (uncachedTexts.length === 0) {
            console.log('[Embedding] Tous les embeddings sont en cache');
            return texts.map(text => ({
                embedding: this.cache.get(this.getCacheKey(text))!,
                text,
                model: this.model,
                dimensions: EMBEDDING_DIMENSIONS
            }));
        }

        try {
            // Traiter par lots de 100 (limite de l'API)
            const batchSize = 100;
            const results: EmbeddingResult[] = [];

            for (let i = 0; i < uncachedTexts.length; i += batchSize) {
                const batch = uncachedTexts.slice(i, i + batchSize);
                
                const response = await fetch('/api/embeddings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: this.model,
                        input: batch
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(`Embeddings API error: ${error.error || response.statusText}`);
                }

                const data = await response.json();
                
                if (!data.data || !Array.isArray(data.data)) {
                    // Retourner des embeddings vides au lieu de lancer une erreur
                    console.warn('[Embedding] API ne supporte pas les embeddings, retour de vecteurs vides');
                    batch.forEach(text => {
                        const emptyEmbedding = new Array(EMBEDDING_DIMENSIONS).fill(0);
                        this.cache.set(this.getCacheKey(text), emptyEmbedding);
                        results.push({
                            embedding: emptyEmbedding,
                            text,
                            model: this.model,
                            dimensions: EMBEDDING_DIMENSIONS
                        });
                    });
                    continue;
                }
                
                // Mettre en cache et ajouter aux résultats
                data.data.forEach((item: any, index: number) => {
                    const text = batch[index];
                    const embedding = item.embedding;
                    this.cache.set(this.getCacheKey(text), embedding);
                    results.push({
                        embedding,
                        text,
                        model: this.model,
                        dimensions: embedding.length
                    });
                });

                console.log(`[Embedding] Batch ${i / batchSize + 1} traité (${batch.length} embeddings)`);
            }

            // Ajouter les embeddings en cache
            const allResults = texts.map(text => {
                const cached = this.cache.get(this.getCacheKey(text));
                if (cached) {
                    return {
                        embedding: cached,
                        text,
                        model: this.model,
                        dimensions: EMBEDDING_DIMENSIONS
                    };
                }
                return results.find(r => r.text === text)!;
            });

            return allResults;
        } catch (error) {
            console.error('[Embedding] Erreur lors de la génération des embeddings en batch:', error);
            throw error;
        }
    }

    /**
     * Calculer la similarité cosinus entre deux embeddings
     */
    cosineSimilarity(embedding1: number[], embedding2: number[]): number {
        if (embedding1.length !== embedding2.length) {
            throw new Error('Les embeddings doivent avoir la même dimension');
        }

        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;

        for (let i = 0; i < embedding1.length; i++) {
            dotProduct += embedding1[i] * embedding2[i];
            norm1 += embedding1[i] * embedding1[i];
            norm2 += embedding2[i] * embedding2[i];
        }

        const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
        return magnitude === 0 ? 0 : dotProduct / magnitude;
    }

    /**
     * Trouver les embeddings les plus similaires à une requête
     */
    findMostSimilar(
        queryEmbedding: number[],
        candidateEmbeddings: { embedding: number[]; metadata: any }[],
        topK: number = 5
    ): { similarity: number; metadata: any }[] {
        const similarities = candidateEmbeddings.map(candidate => ({
            similarity: this.cosineSimilarity(queryEmbedding, candidate.embedding),
            metadata: candidate.metadata
        }));

        // Trier par similarité décroissante
        similarities.sort((a, b) => b.similarity - a.similarity);

        return similarities.slice(0, topK);
    }

    /**
     * Générer une clé de cache pour un texte
     */
    private getCacheKey(text: string): string {
        // Utiliser un hash simple du texte comme clé
        return text.substring(0, 100) + text.length;
    }

    /**
     * Vider le cache
     */
    clearCache(): void {
        this.cache.clear();
        console.log('[Embedding] Cache vidé');
    }

    /**
     * Obtenir les statistiques du cache
     */
    getCacheStats(): { size: number; keys: string[] } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()).map(k => k.substring(0, 50) + '...')
        };
    }
}

// Instance globale du service d'embeddings
export const embeddingService = new EmbeddingService();

// Fonctions utilitaires
export const generateEmbedding = (text: string): Promise<EmbeddingResult> => {
    return embeddingService.generateEmbedding(text);
};

export const generateEmbeddingsBatch = (texts: string[]): Promise<EmbeddingResult[]> => {
    return embeddingService.generateEmbeddingsBatch(texts);
};

export const cosineSimilarity = (embedding1: number[], embedding2: number[]): number => {
    return embeddingService.cosineSimilarity(embedding1, embedding2);
};

export const findMostSimilar = (
    queryEmbedding: number[],
    candidateEmbeddings: { embedding: number[]; metadata: any }[],
    topK?: number
): { similarity: number; metadata: any }[] => {
    return embeddingService.findMostSimilar(queryEmbedding, candidateEmbeddings, topK);
};
