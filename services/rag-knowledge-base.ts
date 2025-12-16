// Service pour gérer la base de connaissances RAG dans IndexedDB

const DB_NAME = 'JusticiaKnowledgeBase';
const STORE_NAME = 'documents';
const DB_VERSION = 1;

export interface RAGDocument {
  id: string;
  title: string;
  content: string;
  type: 'document' | 'report' | 'analysis';
  timestamp: number;
  metadata?: any;
}

// Ouvrir la base de données IndexedDB
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        objectStore.createIndex('type', 'type', { unique: false });
      }
    };
  });
}

// Ajouter un document à la base de connaissances
export async function addDocumentToKnowledgeBase(doc: RAGDocument): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(doc);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    console.log('✅ Document ajouté au RAG:', doc.title);
  } catch (error) {
    console.error('❌ Erreur ajout RAG:', error);
    throw error;
  }
}

// Récupérer tous les documents de la base de connaissances
export async function getAllKnowledgeBaseDocuments(): Promise<RAGDocument[]> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('❌ Erreur récupération RAG:', error);
    return [];
  }
}

// Supprimer un document de la base de connaissances
export async function removeDocumentFromKnowledgeBase(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    console.log('✅ Document supprimé du RAG:', id);
  } catch (error) {
    console.error('❌ Erreur suppression RAG:', error);
    throw error;
  }
}

// Rechercher dans la base de connaissances
export async function searchKnowledgeBase(query: string): Promise<RAGDocument[]> {
  try {
    const allDocs = await getAllKnowledgeBaseDocuments();
    const lowerQuery = query.toLowerCase();
    
    return allDocs.filter(doc => 
      doc.title.toLowerCase().includes(lowerQuery) ||
      doc.content.toLowerCase().includes(lowerQuery)
    );
  } catch (error) {
    console.error('❌ Erreur recherche RAG:', error);
    return [];
  }
}

// Migrer les documents existants depuis l'API vers le RAG
export async function migrateExistingDocumentsToRAG(): Promise<{ total: number; success: number }> {
  try {
    console.log('🔄 Migration des documents existants vers RAG...');
    
    // Récupérer tous les documents depuis l'API
    const response = await fetch('/api/documents');
    if (!response.ok) throw new Error('Erreur récupération documents');
    
    const data = await response.json();
    const documents = data.documents || [];
    
    console.log(`📄 ${documents.length} documents trouvés`);
    
    // Ajouter chaque document au RAG
    let successCount = 0;
    for (const doc of documents) {
      try {
        await addDocumentToKnowledgeBase({
          id: doc.id.toString(),
          title: doc.title,
          content: doc.content,
          type: doc.document_type || 'document',
          timestamp: new Date(doc.created_at).getTime(),
          metadata: {
            documentType: doc.document_type,
            createdAt: doc.created_at
          }
        });
        successCount++;
      } catch (error) {
        console.error(`❌ Erreur migration document ${doc.id}:`, error);
      }
    }
    
    console.log(`✅ Migration terminée: ${successCount}/${documents.length} documents`);
    return { total: documents.length, success: successCount };
  } catch (error) {
    console.error('❌ Erreur migration RAG:', error);
    throw error;
  }
}
