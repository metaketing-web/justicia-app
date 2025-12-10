/**
 * Service d'initialisation de la base RAG avec des documents de référence
 * Ajoute automatiquement le Code du Travail Ivoirien 2023 à la base de connaissances
 */

import { enhancedRAGService } from './ragService.enhanced';

const CODE_TRAVAIL_URL = '/code-travail-ivoirien-2023.txt';
const CODE_TRAVAIL_ID_KEY = 'justicia_code_travail_id';

/**
 * Vérifie si le Code du Travail est déjà dans la base RAG
 */
async function isCodeTravailLoaded(): Promise<boolean> {
  try {
    const storedId = localStorage.getItem(CODE_TRAVAIL_ID_KEY);
    if (!storedId) return false;

    const doc = await enhancedRAGService.getDocument(storedId);
    return doc !== null;
  } catch (error) {
    console.error('[RAG Init] Erreur lors de la vérification:', error);
    return false;
  }
}

/**
 * Charge le Code du Travail Ivoirien depuis le fichier texte
 */
async function loadCodeTravailText(): Promise<string> {
  try {
    const response = await fetch(CODE_TRAVAIL_URL);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    const text = await response.text();
    return text;
  } catch (error) {
    console.error('[RAG Init] Erreur lors du chargement du fichier:', error);
    throw error;
  }
}

/**
 * Initialise la base RAG avec le Code du Travail Ivoirien
 */
export async function initializeRAGWithCodeTravail(): Promise<void> {
  try {
    console.log('[RAG Init] Vérification de la base de connaissances...');

    // Vérifier si le Code du Travail est déjà chargé
    const isLoaded = await isCodeTravailLoaded();
    
    if (isLoaded) {
      console.log('[RAG Init] ✅ Code du Travail Ivoirien déjà présent dans la base');
      return;
    }

    console.log('[RAG Init] 📚 Chargement du Code du Travail Ivoirien 2023...');

    // Charger le texte du Code du Travail
    const codeText = await loadCodeTravailText();
    console.log(`[RAG Init] Texte chargé: ${codeText.length} caractères`);

    // Ajouter à la base RAG
    const docId = await enhancedRAGService.addDocument(
      'Code du Travail Ivoirien 2023',
      codeText,
      'legal_code',
      {
        source: 'Gouvernement de Côte d\'Ivoire',
        year: 2023,
        category: 'Législation du travail',
        country: 'Côte d\'Ivoire',
        isReference: true,
        autoLoaded: true
      }
    );

    // Sauvegarder l'ID pour éviter de recharger
    localStorage.setItem(CODE_TRAVAIL_ID_KEY, docId);

    console.log(`[RAG Init] ✅ Code du Travail Ivoirien ajouté avec succès (ID: ${docId})`);
  } catch (error) {
    console.error('[RAG Init] ❌ Erreur lors de l\'initialisation:', error);
    // Ne pas bloquer l'application si l'initialisation échoue
  }
}

/**
 * Réinitialise le Code du Travail (force le rechargement)
 */
export async function resetCodeTravail(): Promise<void> {
  try {
    const storedId = localStorage.getItem(CODE_TRAVAIL_ID_KEY);
    if (storedId) {
      await enhancedRAGService.removeDocument(storedId);
      localStorage.removeItem(CODE_TRAVAIL_ID_KEY);
      console.log('[RAG Init] Code du Travail supprimé');
    }
    await initializeRAGWithCodeTravail();
  } catch (error) {
    console.error('[RAG Init] Erreur lors de la réinitialisation:', error);
    throw error;
  }
}

export default {
  initializeRAGWithCodeTravail,
  resetCodeTravail
};

