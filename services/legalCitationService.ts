/**
 * Service de gestion des citations juridiques
 * Permet de citer automatiquement les sources juridiques (actes, lois, règlements)
 */

export interface LegalSource {
  id: string;
  title: string;
  type: 'acte_uniforme' | 'loi' | 'reglement' | 'instruction' | 'code' | 'jurisprudence';
  reference: string; // Ex: "Acte uniforme n°2010-08"
  article?: string; // Ex: "Article 39"
  year: number;
  jurisdiction: 'OHADA' | 'CI' | 'BCEAO' | 'UEMOA' | 'CREPMF';
  url?: string;
  excerpt?: string; // Extrait pertinent
}

export interface CitedResponse {
  content: string; // Réponse de l'IA
  sources: LegalSource[]; // Sources citées
}

/**
 * Formate une citation juridique selon les normes
 */
export function formatCitation(source: LegalSource): string {
  let citation = '';
  
  // Type de document
  switch (source.type) {
    case 'acte_uniforme':
      citation = `Acte uniforme ${source.reference}`;
      break;
    case 'loi':
      citation = `Loi ${source.reference}`;
      break;
    case 'reglement':
      citation = `Règlement ${source.reference}`;
      break;
    case 'instruction':
      citation = `Instruction ${source.reference}`;
      break;
    case 'code':
      citation = `${source.title}`;
      break;
    case 'jurisprudence':
      citation = `${source.title}`;
      break;
  }
  
  // Article si spécifié
  if (source.article) {
    citation += `, ${source.article}`;
  }
  
  // Juridiction et année
  citation += ` (${source.jurisdiction}, ${source.year})`;
  
  return citation;
}

/**
 * Génère une référence bibliographique complète
 */
export function formatBibliographicReference(source: LegalSource): string {
  let ref = `${source.title}`;
  
  if (source.article) {
    ref += `, ${source.article}`;
  }
  
  ref += `, ${source.reference}`;
  ref += `, ${source.jurisdiction}`;
  ref += `, ${source.year}`;
  
  if (source.url) {
    ref += `. Disponible sur : ${source.url}`;
  }
  
  return ref;
}

/**
 * Extrait les sources juridiques d'un texte RAG
 */
export function extractSourcesFromRAGContext(ragResults: any[]): LegalSource[] {
  const sources: LegalSource[] = [];
  
  for (const result of ragResults) {
    if (result.metadata) {
      const meta = result.metadata;
      
      // Construire la source à partir des métadonnées
      const source: LegalSource = {
        id: result.id || `source_${sources.length}`,
        title: meta.title || meta.documentName || 'Document juridique',
        type: meta.type || 'loi',
        reference: meta.reference || meta.documentId || '',
        article: meta.article,
        year: meta.year || new Date().getFullYear(),
        jurisdiction: meta.jurisdiction || 'CI',
        url: meta.url || meta.sourceUrl,
        excerpt: result.content?.substring(0, 200) + '...'
      };
      
      sources.push(source);
    }
  }
  
  return sources;
}

/**
 * Génère un prompt système pour forcer les citations
 */
export function getLegalCitationSystemPrompt(): string {
  return `Tu es un assistant juridique expert en droit ivoirien et OHADA.

RÈGLES DE CITATION OBLIGATOIRES :
1. Pour chaque affirmation juridique, tu DOIS citer la source exacte
2. Format de citation : [Acte/Loi/Règlement + Référence + Article si applicable + (Juridiction, Année)]
3. Exemple : "Selon l'Acte uniforme relatif au droit commercial général, Article 39 (OHADA, 2010)..."
4. Si tu utilises le Code du Travail Ivoirien, cite : "Code du Travail Ivoirien 2023, Article X"
5. Si tu utilises un règlement BCEAO, cite : "Règlement n°XX/YYYY/CM/UEMOA (BCEAO, YYYY)"

STRUCTURE DE RÉPONSE :
1. Réponse directe avec citations intégrées
2. Section "📚 Sources juridiques" à la fin listant toutes les références

Exemple de réponse :
"Le délai de préavis est fixé à 3 mois pour les cadres selon le Code du Travail Ivoirien 2023, Article 16.12. Cette disposition s'applique conformément à l'Acte uniforme relatif au droit du travail, Article 39 (OHADA, 2019).

📚 **Sources juridiques :**
1. Code du Travail Ivoirien 2023, Article 16.12 (CI, 2023)
2. Acte uniforme relatif au droit du travail, Article 39 (OHADA, 2019)"`;
}

/**
 * Parse les citations d'une réponse IA
 */
export function parseCitationsFromResponse(response: string): LegalSource[] {
  const sources: LegalSource[] = [];
  
  // Pattern pour détecter les citations
  // Ex: "Code du Travail Ivoirien 2023, Article 16.12 (CI, 2023)"
  const citationPattern = /([^,]+),\s*Article\s+(\d+(?:\.\d+)?)\s*\(([A-Z]+),\s*(\d{4})\)/g;
  
  let match;
  while ((match = citationPattern.exec(response)) !== null) {
    const [, title, article, jurisdiction, year] = match;
    
    sources.push({
      id: `citation_${sources.length}`,
      title: title.trim(),
      type: title.includes('Code') ? 'code' : 'loi',
      reference: `Article ${article}`,
      article: `Article ${article}`,
      year: parseInt(year),
      jurisdiction: jurisdiction as any,
    });
  }
  
  return sources;
}

/**
 * Ajoute les citations à une réponse RAG
 */
export function enhanceResponseWithCitations(
  response: string,
  ragResults: any[]
): CitedResponse {
  const sources = extractSourcesFromRAGContext(ragResults);
  
  // Ajouter la section sources si elle n'existe pas
  if (!response.includes('📚')) {
    let citationsSection = '\n\n📚 **Sources juridiques :**\n';
    sources.forEach((source, index) => {
      citationsSection += `${index + 1}. ${formatBibliographicReference(source)}\n`;
    });
    response += citationsSection;
  }
  
  return {
    content: response,
    sources
  };
}

/**
 * Valide qu'une réponse contient des citations
 */
export function validateCitations(response: string): {
  valid: boolean;
  message?: string;
} {
  // Vérifier la présence de la section sources
  if (!response.includes('📚')) {
    return {
      valid: false,
      message: 'La réponse ne contient pas de section "Sources juridiques"'
    };
  }
  
  // Vérifier la présence d'au moins une citation
  const citations = parseCitationsFromResponse(response);
  if (citations.length === 0) {
    return {
      valid: false,
      message: 'Aucune citation juridique détectée dans la réponse'
    };
  }
  
  return { valid: true };
}

export default {
  formatCitation,
  formatBibliographicReference,
  extractSourcesFromRAGContext,
  getLegalCitationSystemPrompt,
  parseCitationsFromResponse,
  enhanceResponseWithCitations,
  validateCitations
};
