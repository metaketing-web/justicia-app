/**
 * Service de gestion de l'historique des documents
 * Stocke et récupère tous les documents générés, synthèses et enregistrements
 */

export interface DocumentHistoryItem {
  id: string;
  type: 'template' | 'chat_synthesis' | 'analysis_report' | 'audio_recording';
  title: string;
  description?: string;
  createdAt: Date;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  metadata?: {
    templateName?: string;
    sessionId?: string;
    duration?: number;
    messageCount?: number;
    analysisType?: string;
  };
}

const STORAGE_KEY = 'justicia_document_history';

/**
 * Récupère tout l'historique des documents
 */
export function getDocumentHistory(): DocumentHistoryItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const items = JSON.parse(stored);
    // Convertir les dates en objets Date
    return items.map((item: any) => ({
      ...item,
      createdAt: new Date(item.createdAt)
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    return [];
  }
}

/**
 * Ajoute un document à l'historique
 */
export function addDocumentToHistory(item: Omit<DocumentHistoryItem, 'id' | 'createdAt'>): DocumentHistoryItem {
  try {
    const history = getDocumentHistory();
    
    const newItem: DocumentHistoryItem = {
      ...item,
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };
    
    history.unshift(newItem); // Ajouter au début
    
    // Limiter à 500 documents max
    const limitedHistory = history.slice(0, 500);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedHistory));
    
    console.log('[HISTORY] Document ajouté:', newItem.title);
    return newItem;
  } catch (error) {
    console.error('Erreur lors de l\'ajout à l\'historique:', error);
    throw error;
  }
}

/**
 * Supprime un document de l'historique
 */
export function removeDocumentFromHistory(id: string): void {
  try {
    const history = getDocumentHistory();
    const filtered = history.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    console.log('[HISTORY] Document supprimé:', id);
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    throw error;
  }
}

/**
 * Recherche dans l'historique
 */
export function searchDocumentHistory(query: string): DocumentHistoryItem[] {
  const history = getDocumentHistory();
  const lowerQuery = query.toLowerCase();
  
  return history.filter(item => 
    item.title.toLowerCase().includes(lowerQuery) ||
    item.description?.toLowerCase().includes(lowerQuery) ||
    item.fileName?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Filtre l'historique par type
 */
export function filterDocumentHistoryByType(type: DocumentHistoryItem['type']): DocumentHistoryItem[] {
  const history = getDocumentHistory();
  return history.filter(item => item.type === type);
}

/**
 * Filtre l'historique par période
 */
export function filterDocumentHistoryByDate(startDate: Date, endDate: Date): DocumentHistoryItem[] {
  const history = getDocumentHistory();
  return history.filter(item => 
    item.createdAt >= startDate && item.createdAt <= endDate
  );
}

/**
 * Efface tout l'historique
 */
export function clearDocumentHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('[HISTORY] Historique effacé');
  } catch (error) {
    console.error('Erreur lors de l\'effacement:', error);
    throw error;
  }
}

/**
 * Exporte l'historique en JSON
 */
export function exportDocumentHistory(): string {
  const history = getDocumentHistory();
  return JSON.stringify(history, null, 2);
}

/**
 * Importe l'historique depuis JSON
 */
export function importDocumentHistory(jsonData: string): void {
  try {
    const items = JSON.parse(jsonData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    console.log('[HISTORY] Historique importé');
  } catch (error) {
    console.error('Erreur lors de l\'importation:', error);
    throw error;
  }
}

export default {
  getDocumentHistory,
  addDocumentToHistory,
  removeDocumentFromHistory,
  searchDocumentHistory,
  filterDocumentHistoryByType,
  filterDocumentHistoryByDate,
  clearDocumentHistory,
  exportDocumentHistory,
  importDocumentHistory
};
