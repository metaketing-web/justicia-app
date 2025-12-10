/**
 * Service de stockage persistant avec IndexedDB
 * Permet de stocker des documents et leurs embeddings de manière persistante
 */

const DB_NAME = 'JusticiaRAG';
const DB_VERSION = 1;
const DOCUMENTS_STORE = 'documents';
const EMBEDDINGS_STORE = 'embeddings';

export interface StoredDocument {
    id: string;
    name: string;
    content: string;
    chunks: string[];
    uploadDate: string;
    type: string;
    metadata?: {
        wordCount?: number;
        charCount?: number;
        sentenceCount?: number;
        analysisResult?: any;
    };
}

export interface StoredEmbedding {
    id: string; // documentId-chunkIndex
    documentId: string;
    chunkIndex: number;
    embedding: number[];
    chunk: string;
}

class IndexedDBService {
    private db: IDBDatabase | null = null;
    private initPromise: Promise<void> | null = null;

    constructor() {
        this.initPromise = this.init();
    }

    /**
     * Initialiser la base de données IndexedDB
     */
    private async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('[IndexedDB] Erreur lors de l\'ouverture de la base de données');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('[IndexedDB] Base de données ouverte avec succès');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Store pour les documents
                if (!db.objectStoreNames.contains(DOCUMENTS_STORE)) {
                    const documentsStore = db.createObjectStore(DOCUMENTS_STORE, { keyPath: 'id' });
                    documentsStore.createIndex('name', 'name', { unique: false });
                    documentsStore.createIndex('type', 'type', { unique: false });
                    documentsStore.createIndex('uploadDate', 'uploadDate', { unique: false });
                    console.log('[IndexedDB] Store "documents" créé');
                }

                // Store pour les embeddings
                if (!db.objectStoreNames.contains(EMBEDDINGS_STORE)) {
                    const embeddingsStore = db.createObjectStore(EMBEDDINGS_STORE, { keyPath: 'id' });
                    embeddingsStore.createIndex('documentId', 'documentId', { unique: false });
                    console.log('[IndexedDB] Store "embeddings" créé');
                }
            };
        });
    }

    /**
     * Attendre que la base de données soit prête
     */
    private async ensureReady(): Promise<void> {
        if (this.initPromise) {
            await this.initPromise;
        }
    }

    /**
     * Sauvegarder un document
     */
    async saveDocument(document: StoredDocument): Promise<void> {
        await this.ensureReady();
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([DOCUMENTS_STORE], 'readwrite');
            const store = transaction.objectStore(DOCUMENTS_STORE);
            const request = store.put(document);

            request.onsuccess = () => {
                console.log(`[IndexedDB] Document sauvegardé: ${document.name}`);
                resolve();
            };

            request.onerror = () => {
                console.error('[IndexedDB] Erreur lors de la sauvegarde du document');
                reject(request.error);
            };
        });
    }

    /**
     * Récupérer un document par son ID
     */
    async getDocument(id: string): Promise<StoredDocument | null> {
        await this.ensureReady();
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([DOCUMENTS_STORE], 'readonly');
            const store = transaction.objectStore(DOCUMENTS_STORE);
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result || null);
            };

            request.onerror = () => {
                console.error('[IndexedDB] Erreur lors de la récupération du document');
                reject(request.error);
            };
        });
    }

    /**
     * Récupérer tous les documents
     */
    async getAllDocuments(): Promise<StoredDocument[]> {
        await this.ensureReady();
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([DOCUMENTS_STORE], 'readonly');
            const store = transaction.objectStore(DOCUMENTS_STORE);
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result || []);
            };

            request.onerror = () => {
                console.error('[IndexedDB] Erreur lors de la récupération des documents');
                reject(request.error);
            };
        });
    }

    /**
     * Supprimer un document
     */
    async deleteDocument(id: string): Promise<void> {
        await this.ensureReady();
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([DOCUMENTS_STORE, EMBEDDINGS_STORE], 'readwrite');
            
            // Supprimer le document
            const documentsStore = transaction.objectStore(DOCUMENTS_STORE);
            documentsStore.delete(id);

            // Supprimer les embeddings associés
            const embeddingsStore = transaction.objectStore(EMBEDDINGS_STORE);
            const index = embeddingsStore.index('documentId');
            const request = index.openCursor(IDBKeyRange.only(id));

            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest).result;
                if (cursor) {
                    embeddingsStore.delete(cursor.primaryKey);
                    cursor.continue();
                }
            };

            transaction.oncomplete = () => {
                console.log(`[IndexedDB] Document supprimé: ${id}`);
                resolve();
            };

            transaction.onerror = () => {
                console.error('[IndexedDB] Erreur lors de la suppression du document');
                reject(transaction.error);
            };
        });
    }

    /**
     * Sauvegarder un embedding
     */
    async saveEmbedding(embedding: StoredEmbedding): Promise<void> {
        await this.ensureReady();
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([EMBEDDINGS_STORE], 'readwrite');
            const store = transaction.objectStore(EMBEDDINGS_STORE);
            const request = store.put(embedding);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                console.error('[IndexedDB] Erreur lors de la sauvegarde de l\'embedding');
                reject(request.error);
            };
        });
    }

    /**
     * Récupérer tous les embeddings d'un document
     */
    async getDocumentEmbeddings(documentId: string): Promise<StoredEmbedding[]> {
        await this.ensureReady();
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([EMBEDDINGS_STORE], 'readonly');
            const store = transaction.objectStore(EMBEDDINGS_STORE);
            const index = store.index('documentId');
            const request = index.getAll(documentId);

            request.onsuccess = () => {
                resolve(request.result || []);
            };

            request.onerror = () => {
                console.error('[IndexedDB] Erreur lors de la récupération des embeddings');
                reject(request.error);
            };
        });
    }

    /**
     * Récupérer tous les embeddings
     */
    async getAllEmbeddings(): Promise<StoredEmbedding[]> {
        await this.ensureReady();
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([EMBEDDINGS_STORE], 'readonly');
            const store = transaction.objectStore(EMBEDDINGS_STORE);
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result || []);
            };

            request.onerror = () => {
                console.error('[IndexedDB] Erreur lors de la récupération de tous les embeddings');
                reject(request.error);
            };
        });
    }

    /**
     * Vider complètement la base de données
     */
    async clearAll(): Promise<void> {
        await this.ensureReady();
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([DOCUMENTS_STORE, EMBEDDINGS_STORE], 'readwrite');
            
            transaction.objectStore(DOCUMENTS_STORE).clear();
            transaction.objectStore(EMBEDDINGS_STORE).clear();

            transaction.oncomplete = () => {
                console.log('[IndexedDB] Base de données vidée');
                resolve();
            };

            transaction.onerror = () => {
                console.error('[IndexedDB] Erreur lors du vidage de la base de données');
                reject(transaction.error);
            };
        });
    }

    /**
     * Obtenir les statistiques de la base de données
     */
    async getStats(): Promise<{ documentCount: number; embeddingCount: number }> {
        await this.ensureReady();
        if (!this.db) throw new Error('Database not initialized');

        const documents = await this.getAllDocuments();
        const embeddings = await this.getAllEmbeddings();

        return {
            documentCount: documents.length,
            embeddingCount: embeddings.length
        };
    }
}

// Instance globale du service IndexedDB
export const indexedDBService = new IndexedDBService();

