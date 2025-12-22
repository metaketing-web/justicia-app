import React, { useState } from 'react';
import { Search, ExternalLink, AlertCircle } from 'lucide-react';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

interface AIWebSearchProps {
  query: string;
  onResultsFound?: (results: SearchResult[]) => void;
}

const AIWebSearch: React.FC<AIWebSearchProps> = ({ query, onResultsFound }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const performWebSearch = async (searchQuery: string) => {
    setIsSearching(true);
    setError(null);

    try {
      console.log('[AIWebSearch] Recherche:', searchQuery);
      
      // Appel à l'API Brave Search via le backend
      const response = await fetch('/api/brave-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const data = await response.json();
      console.log('[AIWebSearch] Résultats reçus:', data);

      // Transformer les résultats de Brave au format SearchResult
      const searchResults: SearchResult[] = (data.results || []).map((r: any) => ({
        title: r.title || 'Sans titre',
        url: r.url || '#',
        snippet: r.description || r.snippet || 'Pas de description disponible',
        source: r.url ? new URL(r.url).hostname : 'source inconnue'
      })).slice(0, 5); // Limiter à 5 résultats

      setResults(searchResults);
      
      if (onResultsFound) {
        onResultsFound(searchResults);
      }

      console.log('[AIWebSearch] Recherche terminée:', searchResults.length, 'résultats');
    } catch (err) {
      console.error('[AIWebSearch] Erreur:', err);
      setError("Erreur lors de la recherche internet. Veuillez réessayer.");
    } finally {
      setIsSearching(false);
    }
  };

  React.useEffect(() => {
    if (query && query.trim().length > 0) {
      performWebSearch(query);
    }
  }, [query]);

  if (isSearching) {
    return (
      <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4 my-4">
        <div className="flex items-center gap-3">
          <div className="animate-spin">
            <Search className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-purple-300 font-medium">Recherche en cours sur internet...</p>
            <p className="text-purple-400/70 text-sm">Consultation de sources juridiques en ligne</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 my-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-purple-900/30 via-pink-900/30 to-orange-900/30 border border-purple-500/30 rounded-xl p-6 my-4">
      <div className="flex items-center gap-2 mb-4">
        <Search className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-bold text-white">Résultats de recherche internet</h3>
      </div>
      
      <p className="text-purple-300/80 text-sm mb-4">
        J'ai trouvé les ressources suivantes qui pourraient répondre à votre question :
      </p>

      <div className="space-y-3">
        {results.map((result, index) => (
          <a
            key={index}
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-neutral-900/50 hover:bg-neutral-800/50 border border-neutral-700 rounded-lg p-4 transition-all duration-200 hover:border-purple-500/50 group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h4 className="text-white font-semibold mb-1 group-hover:text-purple-300 transition-colors">
                  {result.title}
                </h4>
                <p className="text-neutral-400 text-sm mb-2 line-clamp-2">
                  {result.snippet}
                </p>
                <div className="flex items-center gap-2 text-xs text-purple-400">
                  <span>{result.source}</span>
                  <span>•</span>
                  <span className="truncate">{result.url}</span>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-purple-400 flex-shrink-0 mt-1 group-hover:text-purple-300" />
            </div>
          </a>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-purple-500/20">
        <p className="text-purple-300/60 text-xs">
          💡 <strong>Conseil :</strong> Vérifiez toujours les sources officielles pour les textes de loi. 
          Le site <a href="https://loidici.biz" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">loidici.biz</a> contient 
          les textes officiels des lois ivoiriennes.
        </p>
      </div>
    </div>
  );
};

export default AIWebSearch;
