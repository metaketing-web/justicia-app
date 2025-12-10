/**
 * Service de recherche web avec Brave Search API
 * Permet à l'IA de rechercher automatiquement sur Internet
 */

export interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
  age?: string;
}

export interface BraveSearchResponse {
  query: string;
  results: BraveSearchResult[];
  success: boolean;
  error?: string;
}

/**
 * Recherche sur le web avec Brave Search API
 */
export async function searchWeb(query: string, count: number = 5, context?: string): Promise<BraveSearchResponse> {
  try {
    // Enrichir la requête avec le contexte juridique ivoirien
    let enrichedQuery = query;
    
    // Détecter si le contexte mentionne la Côte d'Ivoire
    const isIvorianContext = context?.toLowerCase().includes('ivoire') || 
                            context?.toLowerCase().includes('ivoirien') ||
                            query.toLowerCase().includes('ivoire') ||
                            query.toLowerCase().includes('ivoirien');
    
    // Détecter si la requête concerne le droit/juridique
    const isLegalContext = context?.toLowerCase().includes('loi') ||
                          context?.toLowerCase().includes('code') ||
                          context?.toLowerCase().includes('juridique') ||
                          context?.toLowerCase().includes('droit') ||
                          context?.toLowerCase().includes('nationalité') ||
                          query.toLowerCase().includes('loi') ||
                          query.toLowerCase().includes('juridique') ||
                          query.toLowerCase().includes('droit');
    
    // Ajouter "Côte d'Ivoire droit" si contexte juridique ivoirien
    if (isIvorianContext && isLegalContext && !query.toLowerCase().includes('ivoire')) {
      enrichedQuery = `${query} droit Côte d'Ivoire`;
      console.log(`[Brave Search] Requête juridique enrichie: "${enrichedQuery}"`);
    }
    // Ajouter "Côte d'Ivoire" si contexte ivoirien non juridique
    else if (isIvorianContext && !query.toLowerCase().includes('ivoire')) {
      enrichedQuery = `${query} Côte d'Ivoire`;
      console.log(`[Brave Search] Requête enrichie: "${enrichedQuery}"`);
    }
    // Ajouter "droit" si contexte juridique sans pays
    else if (isLegalContext && !query.toLowerCase().includes('droit') && !query.toLowerCase().includes('juridique')) {
      enrichedQuery = `${query} droit`;
      console.log(`[Brave Search] Requête juridique: "${enrichedQuery}"`);
    }
    
    console.log(`[Brave Search] Recherche: "${enrichedQuery}"`);
    
    // Appel au backend qui gère la clé API de manière sécurisée
    const response = await fetch('/api/brave-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        query: enrichedQuery, 
        count,
        country: isIvorianContext ? 'CI' : undefined // Géolocalisation Côte d'Ivoire
      }),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    
    console.log(`[Brave Search] ${data.results.length} résultats trouvés`);
    
    return data;
  } catch (error) {
    console.error('[Brave Search] Erreur:', error);
    return {
      query,
      results: [],
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Filtre les résultats pour garder uniquement les sources juridiques pertinentes
 */
function filterLegalResults(results: any[], context?: string): any[] {
  // Sites à EXCLURE (management, business, outils)
  const excludedDomains = [
    'hellowork.com',
    'asana.com',
    'monday.com',
    'trello.com',
    'notion.so',
    'clickup.com',
    'managers-en-mission.com',
    'growth-incubateur.com',
    'linkedin.com/pulse',
    'medium.com',
    'blog.',
  ];
  
  // Mots-clés à EXCLURE dans le titre/description
  const excludedKeywords = [
    'amélioration continue',
    'lean',
    'six sigma',
    'pdca',
    'kpi',
    'performance',
    'management',
    'entreprise',
    'business',
    'marketing',
    'productivité',
    'outils',
    'logiciel',
  ];
  
  // Sites juridiques PRIORITAIRES
  const legalDomains = [
    'legifrance.gouv.fr',
    'gouv.ci',
    'justice.gouv.ci',
    'droit-afrique.com',
    'ohada.com',
    'juricaf.org',
    'doctrine.fr',
    'dalloz.fr',
    'lexisnexis.fr',
    'village-justice.com',
    'avocat.ci',
    'barreau',
  ];
  
  return results.filter(result => {
    const url = result.url.toLowerCase();
    const title = result.title.toLowerCase();
    const description = result.description.toLowerCase();
    
    // EXCLURE les domaines interdits
    if (excludedDomains.some(domain => url.includes(domain))) {
      console.log(`[Filter] Exclu (domaine): ${result.title}`);
      return false;
    }
    
    // EXCLURE les résultats avec mots-clés interdits
    if (excludedKeywords.some(keyword => title.includes(keyword) || description.includes(keyword))) {
      console.log(`[Filter] Exclu (mot-clé): ${result.title}`);
      return false;
    }
    
    // PRIORISER les sites juridiques
    const isLegalSite = legalDomains.some(domain => url.includes(domain));
    if (isLegalSite) {
      console.log(`[Filter] Priorité (site juridique): ${result.title}`);
      return true;
    }
    
    // Garder si contient des mots-clés juridiques
    const legalKeywords = ['loi', 'code', 'juridique', 'droit', 'justice', 'tribunal', 'avocat', 'nationalité', 'législation'];
    const hasLegalKeyword = legalKeywords.some(keyword => title.includes(keyword) || description.includes(keyword));
    
    if (hasLegalKeyword) {
      console.log(`[Filter] Accepté (juridique): ${result.title}`);
      return true;
    }
    
    console.log(`[Filter] Exclu (non juridique): ${result.title}`);
    return false;
  });
}

/**
 * Formatte les résultats de recherche pour l'IA
 */
export function formatSearchResultsForAI(searchResponse: BraveSearchResponse, context?: string): string {
  if (!searchResponse.success || searchResponse.results.length === 0) {
    return "Aucun résultat trouvé sur Internet.";
  }
  
  // Filtrer les résultats pour garder uniquement les sources juridiques
  const filteredResults = filterLegalResults(searchResponse.results, context);
  
  if (filteredResults.length === 0) {
    return "Aucun résultat juridique pertinent trouvé sur Internet.";
  }

  let formatted = `Résultats de recherche web pour "${searchResponse.query}" (${filteredResults.length} sources juridiques pertinentes):\n\n`;
  
  filteredResults.forEach((result, index) => {
    formatted += `${index + 1}. **${result.title}**\n`;
    formatted += `   ${result.description}\n`;
    formatted += `   Source: ${result.url}\n\n`;
  });

  return formatted;
}

/**
 * Détecte si une question nécessite une recherche web
 */
export function shouldSearchWeb(userMessage: string, aiResponse?: string): boolean {
  const messageLower = userMessage.toLowerCase();
  
  // Déclencheurs EXPLICITES - L'utilisateur demande une recherche
  const explicitTriggers = [
    'cherche', 'recherche', 'trouve', 'regarde', 'vérifie', 'consulte',
    'sur internet', 'sur le web', 'en ligne', 'sur google',
    'trouve-moi', 'donne-moi', 'montre-moi', 'cherche-moi',
    'peux-tu chercher', 'peux tu chercher', 'est-ce que tu peux chercher',
    'va chercher', 'va voir', 'va regarder',
    'fais une recherche', 'lance une recherche',
  ];
  
  // Vérifier les déclencheurs explicites EN PRIORITÉ
  const hasExplicitTrigger = explicitTriggers.some(trigger => messageLower.includes(trigger));
  
  // Si déclencheur explicite, TOUJOURS chercher
  if (hasExplicitTrigger) {
    console.log('[Search] Déclencheur explicite détecté - Recherche forcée');
    return true;
  }
  
  // Mots-clés indiquant un besoin de recherche (détection automatique)
  const searchKeywords = [
    'actualité', 'récent', 'aujourd\'hui', 'cette année', '2025', '2024', '2023', '2022', '2021', '2020',
    'dernière', 'dernier', 'nouveau', 'nouvelle', 'mise à jour', 'changement',
    'prix', 'tarif', 'coût', 'salaire', 'montant',
    'où', 'comment', 'quand', 'qui', 'quel', 'quelle', 'quels', 'quelles',
    'statistique', 'chiffre', 'donnée', 'pourcentage',
    'internet', 'web',
    'externe', 'source', 'référence',
  ];

  // Vérifier si le message contient des mots-clés
  const needsSearch = searchKeywords.some(keyword => messageLower.includes(keyword));
  
  // Vérifier si c'est une question avec année spécifique
  const hasYearQuestion = /\b(19|20)\d{2}\b/.test(messageLower);
  
  // Vérifier si c'est une question factuelle
  const isFactualQuestion = messageLower.includes('?') && (
    messageLower.includes('quel') || 
    messageLower.includes('combien') ||
    messageLower.includes('où') ||
    messageLower.includes('quand') ||
    messageLower.includes('qui')
  );

  // Vérifier si l'IA indique qu'elle n'a pas la réponse
  const aiDoesntKnow = aiResponse && (
    aiResponse.toLowerCase().includes("je n'ai pas") ||
    aiResponse.toLowerCase().includes("je ne sais pas") ||
    aiResponse.toLowerCase().includes("je ne dispose pas") ||
    aiResponse.toLowerCase().includes("n'ai pas accès") ||
    aiResponse.toLowerCase().includes("pas accès direct") ||
    aiResponse.toLowerCase().includes("information non disponible") ||
    aiResponse.toLowerCase().includes("données insuffisantes") ||
    aiResponse.toLowerCase().includes("temps réel")
  );

  return needsSearch || hasYearQuestion || isFactualQuestion || !!aiDoesntKnow;
}
