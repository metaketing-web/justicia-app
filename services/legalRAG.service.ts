/**
 * Legal RAG Service - Service RAG enrichi pour documents juridiques
 * 
 * Fonctionnalités :
 * - Métadonnées juridiques automatiques (pays, type, domaine, OHADA)
 * - Chunking intelligent par article de loi
 * - Recherche avec filtres (pays, type, domaine)
 * - Support de 8 pays africains
 */

import { generateEmbedding } from './embeddingService';

// Types de métadonnées juridiques
export interface LegalMetadata {
  country: string;              // Code pays (CI, SN, BF, ML, BJ, TG, NE, GN)
  documentType: string;          // Type de document juridique
  documentName: string;          // Nom du document
  domain: string;                // Domaine juridique
  article?: string;              // Numéro d'article (si applicable)
  section?: string;              // Section (si applicable)
  chapter?: string;              // Chapitre (si applicable)
  ohadaApplicable: boolean;      // Si le droit OHADA s'applique
  dateEnacted?: string;          // Date de promulgation
  dateModified?: string;         // Date de dernière modification
  inForce: boolean;              // Si le texte est en vigueur
}

export interface LegalChunk {
  id: string;
  content: string;
  embedding: number[];
  metadata: LegalMetadata;
  score?: number;
}

export interface LegalSearchFilters {
  countries?: string[];          // Filtrer par pays
  documentTypes?: string[];      // Filtrer par type
  domains?: string[];            // Filtrer par domaine
  ohadaOnly?: boolean;           // Uniquement documents OHADA
  inForceOnly?: boolean;         // Uniquement textes en vigueur
}

// Constantes
export const AFRICAN_COUNTRIES = [
  { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮' },
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱' },
  { code: 'BJ', name: 'Bénin', flag: '🇧🇯' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬' },
  { code: 'NE', name: 'Niger', flag: '🇳🇪' },
  { code: 'GN', name: 'Guinée', flag: '🇬🇳' },
];

export const DOCUMENT_TYPES = [
  'Code',
  'Constitution',
  'Loi',
  'Décret',
  'Jurisprudence',
  'Traité',
  'Acte Uniforme OHADA',
  'Contrat',
];

export const LEGAL_DOMAINS = [
  'Droit du Travail',
  'Droit Commercial',
  'Droit Pénal',
  'Droit Civil',
  'Droit Immobilier',
  'Droit Fiscal',
  'Droit Douanier',
  'Droit de l\'Environnement',
  'Droit Minier',
  'Droit Général',
];

// Base de données en mémoire
let legalChunks: LegalChunk[] = [];

/**
 * Détecte automatiquement les métadonnées juridiques depuis le nom du fichier et le contenu
 */
export function detectLegalMetadata(filename: string, content: string): LegalMetadata {
  const lowerFilename = filename.toLowerCase();
  const lowerContent = content.toLowerCase().substring(0, 1000); // Premiers 1000 caractères
  
  // Détection du pays
  let country = 'CI'; // Par défaut Côte d'Ivoire
  if (lowerFilename.includes('senegal') || lowerFilename.includes('sénégal')) country = 'SN';
  if (lowerFilename.includes('burkina')) country = 'BF';
  if (lowerFilename.includes('mali')) country = 'ML';
  if (lowerFilename.includes('benin') || lowerFilename.includes('bénin')) country = 'BJ';
  if (lowerFilename.includes('togo')) country = 'TG';
  if (lowerFilename.includes('niger')) country = 'NE';
  if (lowerFilename.includes('guinee') || lowerFilename.includes('guinée')) country = 'GN';
  
  // Détection du type de document
  let documentType = 'Loi';
  if (lowerFilename.includes('code')) documentType = 'Code';
  if (lowerFilename.includes('constitution')) documentType = 'Constitution';
  if (lowerFilename.includes('decret') || lowerFilename.includes('décret')) documentType = 'Décret';
  if (lowerFilename.includes('jurisprudence') || lowerFilename.includes('arret') || lowerFilename.includes('arrêt')) documentType = 'Jurisprudence';
  if (lowerFilename.includes('traite') || lowerFilename.includes('traité')) documentType = 'Traité';
  if (lowerFilename.includes('ohada') || lowerFilename.includes('acte uniforme')) documentType = 'Acte Uniforme OHADA';
  if (lowerFilename.includes('contrat')) documentType = 'Contrat';
  
  // Détection du domaine juridique
  let domain = 'Droit Général';
  if (lowerFilename.includes('travail') || lowerContent.includes('contrat de travail')) domain = 'Droit du Travail';
  if (lowerFilename.includes('commerce') || lowerFilename.includes('commercial') || lowerContent.includes('société commerciale')) domain = 'Droit Commercial';
  if (lowerFilename.includes('penal') || lowerFilename.includes('pénal') || lowerContent.includes('infraction')) domain = 'Droit Pénal';
  if (lowerFilename.includes('civil') || lowerContent.includes('code civil')) domain = 'Droit Civil';
  if (lowerFilename.includes('immobilier') || lowerContent.includes('propriété foncière')) domain = 'Droit Immobilier';
  if (lowerFilename.includes('fiscal') || lowerFilename.includes('impot') || lowerFilename.includes('impôt')) domain = 'Droit Fiscal';
  if (lowerFilename.includes('douane') || lowerFilename.includes('douanier')) domain = 'Droit Douanier';
  if (lowerFilename.includes('environnement')) domain = 'Droit de l\'Environnement';
  if (lowerFilename.includes('minier') || lowerFilename.includes('mine')) domain = 'Droit Minier';
  
  // Détection OHADA
  const ohadaApplicable = lowerFilename.includes('ohada') || lowerContent.includes('ohada') || documentType === 'Acte Uniforme OHADA';
  
  return {
    country,
    documentType,
    documentName: filename,
    domain,
    ohadaApplicable,
    inForce: true, // Par défaut, on considère que le texte est en vigueur
  };
}

/**
 * Découpe intelligemment un document juridique en chunks par article
 */
export function chunkLegalDocument(content: string, metadata: LegalMetadata): Array<{ content: string; article?: string }> {
  const chunks: Array<{ content: string; article?: string }> = [];
  
  // Regex pour détecter les articles
  const articleRegex = /(Article\s+(\d+(?:\.\d+)?)|Art\.\s*(\d+(?:\.\d+)?))[:\s\-]*/gi;
  
  const matches = [...content.matchAll(articleRegex)];
  
  if (matches.length === 0) {
    // Pas d'articles détectés, découper par paragraphes
    const paragraphs = content.split(/\n\n+/);
    paragraphs.forEach((para, idx) => {
      if (para.trim().length > 50) {
        chunks.push({
          content: para.trim(),
        });
      }
    });
  } else {
    // Découper par articles
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const articleNumber = match[2] || match[3];
      const startIndex = match.index!;
      const endIndex = i < matches.length - 1 ? matches[i + 1].index! : content.length;
      
      const articleContent = content.substring(startIndex, endIndex).trim();
      
      if (articleContent.length > 50) {
        chunks.push({
          content: articleContent,
          article: articleNumber,
        });
      }
    }
  }
  
  return chunks;
}

/**
 * Ajoute un document juridique à la base RAG
 */
export async function addLegalDocument(filename: string, content: string): Promise<void> {
  const metadata = detectLegalMetadata(filename, content);
  const chunks = chunkLegalDocument(content, metadata);
  
  for (const chunk of chunks) {
    const embedding = await generateEmbedding(chunk.content);
    
    const legalChunk: LegalChunk = {
      id: `${filename}-${chunk.article || Date.now()}-${Math.random()}`,
      content: chunk.content,
      embedding,
      metadata: {
        ...metadata,
        article: chunk.article,
      },
    };
    
    legalChunks.push(legalChunk);
  }
  
  console.log(`✅ Document juridique ajouté : ${filename} (${chunks.length} chunks, ${metadata.country}, ${metadata.domain})`);
}

/**
 * Recherche dans la base juridique avec filtres
 */
export async function searchLegalRAG(
  query: string,
  filters: LegalSearchFilters = {},
  topK: number = 10
): Promise<LegalChunk[]> {
  const queryEmbedding = await generateEmbedding(query);
  
  // Filtrer les chunks selon les critères
  let filteredChunks = legalChunks;
  
  if (filters.countries && filters.countries.length > 0) {
    filteredChunks = filteredChunks.filter(chunk => filters.countries!.includes(chunk.metadata.country));
  }
  
  if (filters.documentTypes && filters.documentTypes.length > 0) {
    filteredChunks = filteredChunks.filter(chunk => filters.documentTypes!.includes(chunk.metadata.documentType));
  }
  
  if (filters.domains && filters.domains.length > 0) {
    filteredChunks = filteredChunks.filter(chunk => filters.domains!.includes(chunk.metadata.domain));
  }
  
  if (filters.ohadaOnly) {
    filteredChunks = filteredChunks.filter(chunk => chunk.metadata.ohadaApplicable);
  }
  
  if (filters.inForceOnly) {
    filteredChunks = filteredChunks.filter(chunk => chunk.metadata.inForce);
  }
  
  // Calculer la similarité cosinus
  filteredChunks.forEach(chunk => {
    chunk.score = cosineSimilarity(queryEmbedding, chunk.embedding);
  });
  
  // Trier par score décroissant
  filteredChunks.sort((a, b) => (b.score || 0) - (a.score || 0));
  
  return filteredChunks.slice(0, topK);
}

/**
 * Calcule la similarité cosinus entre deux vecteurs
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Obtient les statistiques de la base juridique
 */
export function getLegalRAGStats() {
  const stats = {
    totalChunks: legalChunks.length,
    byCountry: {} as Record<string, number>,
    byType: {} as Record<string, number>,
    byDomain: {} as Record<string, number>,
    ohadaDocuments: 0,
  };
  
  legalChunks.forEach(chunk => {
    stats.byCountry[chunk.metadata.country] = (stats.byCountry[chunk.metadata.country] || 0) + 1;
    stats.byType[chunk.metadata.documentType] = (stats.byType[chunk.metadata.documentType] || 0) + 1;
    stats.byDomain[chunk.metadata.domain] = (stats.byDomain[chunk.metadata.domain] || 0) + 1;
    if (chunk.metadata.ohadaApplicable) stats.ohadaDocuments++;
  });
  
  return stats;
}

/**
 * Efface toute la base juridique
 */
export function clearLegalRAG(): void {
  legalChunks = [];
  console.log('🗑️ Base juridique effacée');
}
