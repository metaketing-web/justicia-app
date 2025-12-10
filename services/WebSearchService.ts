/**
 * Service de recherche internet pour l'IA Justicia
 * Permet à l'IA de rechercher automatiquement sur internet quand elle n'a pas la réponse
 */

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  relevance: number;
}

export interface LegalSearchResult extends SearchResult {
  category?: string;
  articleReference?: string;
  isOfficialSource: boolean;
}

export class WebSearchService {
  private static instance: WebSearchService;
  
  private constructor() {}
  
  public static getInstance(): WebSearchService {
    if (!WebSearchService.instance) {
      WebSearchService.instance = new WebSearchService();
    }
    return WebSearchService.instance;
  }

  /**
   * Recherche générale sur internet
   */
  async searchWeb(query: string, maxResults: number = 5): Promise<SearchResult[]> {
    try {
      // Simulation de recherche web (à remplacer par une vraie API comme Google Custom Search, Bing, etc.)
      const results: SearchResult[] = [];
      
      // En production, utiliser une vraie API de recherche
      // Exemple avec Google Custom Search API:
      // const response = await fetch(`https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CX}&q=${encodeURIComponent(query)}`);
      // const data = await response.json();
      
      // Pour le moment, retourner des résultats simulés
      console.log(`Recherche web pour: "${query}"`);
      
      return results;
    } catch (error) {
      console.error('Erreur lors de la recherche web:', error);
      return [];
    }
  }

  /**
   * Recherche spécifique aux questions juridiques
   */
  async searchLegalContent(query: string): Promise<LegalSearchResult[]> {
    try {
      const results: LegalSearchResult[] = [];
      
      // Recherche prioritaire sur loidici.biz
      const loidiciResults = await this.searchLoidici(query);
      results.push(...loidiciResults);
      
      // Recherche sur le site officiel OHADA
      const ohadaResults = await this.searchOHADA(query);
      results.push(...ohadaResults);
      
      // Recherche générale sur internet avec focus juridique
      const webResults = await this.searchWeb(`${query} Côte d'Ivoire droit OHADA`);
      results.push(...webResults.map(r => ({
        ...r,
        isOfficialSource: false
      })));
      
      // Trier par pertinence et sources officielles
      return results.sort((a, b) => {
        if (a.isOfficialSource && !b.isOfficialSource) return -1;
        if (!a.isOfficialSource && b.isOfficialSource) return 1;
        return b.relevance - a.relevance;
      });
    } catch (error) {
      console.error('Erreur lors de la recherche juridique:', error);
      return [];
    }
  }

  /**
   * Recherche sur loidici.biz
   */
  private async searchLoidici(query: string): Promise<LegalSearchResult[]> {
    try {
      const results: LegalSearchResult[] = [];
      
      // Simulation de recherche sur loidici.biz
      // En production, faire une vraie requête HTTP
      console.log(`Recherche sur loidici.biz pour: "${query}"`);
      
      // Exemples de résultats basés sur la base de connaissances
      if (query.toLowerCase().includes('sarl') || query.toLowerCase().includes('société')) {
        results.push({
          title: 'Les Sociétés Commerciales et le GIE',
          url: 'https://loidici.biz/2018/09/06/les-societes-commerciales-et-le-groupement-dinteret-economique-gie/',
          snippet: 'Acte Uniforme Révisé relatif au Droit des Sociétés Commerciales et du Groupement d\'Intérêt Économique (OHADA)',
          source: 'loidici.biz',
          relevance: 0.95,
          category: 'societes_commerciales',
          isOfficialSource: true
        });
      }
      
      if (query.toLowerCase().includes('cautionnement') || query.toLowerCase().includes('garantie') || query.toLowerCase().includes('hypothèque')) {
        results.push({
          title: 'Les Sûretés',
          url: 'https://loidici.biz/2018/09/08/les-suretes/',
          snippet: 'Acte Uniforme portant organisation des sûretés (OHADA) - Cautionnement, garanties, hypothèques',
          source: 'loidici.biz',
          relevance: 0.95,
          category: 'suretes',
          isOfficialSource: true
        });
      }
      
      if (query.toLowerCase().includes('injonction') || query.toLowerCase().includes('saisie') || query.toLowerCase().includes('recouvrement')) {
        results.push({
          title: 'Procédures Simplifiées de Recouvrement des Créances et des Voies d\'Exécution',
          url: 'https://loidici.biz/2018/09/08/lorganisation-des-procedures-simplifiees-de-recouvrement-des-creances-et-des-voies-dexecution/',
          snippet: 'Acte Uniforme portant organisation des voies d\'exécution (OHADA) - Injonction de payer, saisies',
          source: 'loidici.biz',
          relevance: 0.95,
          category: 'procedures_recouvrement',
          isOfficialSource: true
        });
      }
      
      if (query.toLowerCase().includes('commerçant') || query.toLowerCase().includes('commerce') || query.toLowerCase().includes('fonds de commerce')) {
        results.push({
          title: 'Le Droit Commercial Général',
          url: 'https://loidici.biz/2018/09/08/le-droit-commercial-general/',
          snippet: 'Acte Uniforme portant sur le Droit Commercial Général (OHADA) - Statut du commerçant, fonds de commerce',
          source: 'loidici.biz',
          relevance: 0.95,
          category: 'droit_commercial_general',
          isOfficialSource: true
        });
      }
      
      return results;
    } catch (error) {
      console.error('Erreur lors de la recherche sur loidici.biz:', error);
      return [];
    }
  }

  /**
   * Recherche sur le site officiel OHADA
   */
  private async searchOHADA(query: string): Promise<LegalSearchResult[]> {
    try {
      const results: LegalSearchResult[] = [];
      
      // Simulation de recherche sur ohada.com
      console.log(`Recherche sur ohada.com pour: "${query}"`);
      
      // En production, faire une vraie requête HTTP vers le site OHADA
      results.push({
        title: 'Site officiel de l\'OHADA',
        url: 'https://www.ohada.com/',
        snippet: 'Organisation pour l\'Harmonisation en Afrique du Droit des Affaires - Textes officiels et jurisprudence',
        source: 'ohada.com',
        relevance: 0.9,
        isOfficialSource: true
      });
      
      return results;
    } catch (error) {
      console.error('Erreur lors de la recherche sur OHADA:', error);
      return [];
    }
  }

  /**
   * Détermine si une question nécessite une recherche internet
   */
  shouldSearchInternet(query: string, localResults: any[]): boolean {
    // Rechercher sur internet si :
    // 1. Aucun résultat local trouvé
    if (localResults.length === 0) return true;
    
    // 2. La question contient des mots-clés spécifiques
    const searchKeywords = [
      'article', 'décret', 'loi', 'jurisprudence', 'ccag',
      'code civil', 'code pénal', 'code de procédure',
      'dernière mise à jour', 'récent', 'nouveau'
    ];
    
    const queryLower = query.toLowerCase();
    return searchKeywords.some(keyword => queryLower.includes(keyword));
  }

  /**
   * Formate les résultats de recherche pour l'affichage
   */
  formatSearchResults(results: LegalSearchResult[]): string {
    if (results.length === 0) {
      return 'Aucun résultat trouvé.';
    }
    
    let formatted = '📚 **Sources juridiques trouvées :**\n\n';
    
    results.slice(0, 5).forEach((result, index) => {
      const officialBadge = result.isOfficialSource ? '✅ **Source officielle**' : '';
      formatted += `${index + 1}. **${result.title}** ${officialBadge}\n`;
      formatted += `   ${result.snippet}\n`;
      formatted += `   🔗 [Consulter](${result.url})\n`;
      if (result.articleReference) {
        formatted += `   📖 Référence : ${result.articleReference}\n`;
      }
      formatted += '\n';
    });
    
    return formatted;
  }
}

export default WebSearchService;
