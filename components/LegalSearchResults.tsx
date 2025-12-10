import React, { useState, useEffect } from 'react';
import { Search, ExternalLink, BookOpen, CheckCircle, AlertCircle } from 'lucide-react';
import WebSearchService, { LegalSearchResult } from '../services/WebSearchService';

interface LegalSearchResultsProps {
  query: string;
  onResultsFound?: (results: LegalSearchResult[]) => void;
}

export const LegalSearchResults: React.FC<LegalSearchResultsProps> = ({ query, onResultsFound }) => {
  const [results, setResults] = useState<LegalSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query) {
      searchLegalContent();
    }
  }, [query]);

  const searchLegalContent = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const searchService = WebSearchService.getInstance();
      const searchResults = await searchService.searchLegalContent(query);
      setResults(searchResults);
      
      if (onResultsFound) {
        onResultsFound(searchResults);
      }
    } catch (err) {
      setError('Erreur lors de la recherche juridique');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 rounded-lg border border-purple-200">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          <span className="text-purple-700 font-medium">Recherche en cours dans la base juridique...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
        <AlertCircle className="w-5 h-5 text-red-600" />
        <span className="text-red-700">{error}</span>
      </div>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center space-x-2 text-purple-700">
        <BookOpen className="w-5 h-5" />
        <h3 className="font-semibold text-lg">Sources juridiques trouvées</h3>
      </div>
      
      <div className="space-y-3">
        {results.slice(0, 5).map((result, index) => (
          <div
            key={index}
            className="p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="font-semibold text-gray-900">{result.title}</h4>
                  {result.isOfficialSource && (
                    <span className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      <CheckCircle className="w-3 h-3" />
                      <span>Source officielle</span>
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 text-sm mb-3">{result.snippet}</p>
                
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span className="flex items-center space-x-1">
                    <ExternalLink className="w-3 h-3" />
                    <span>{result.source}</span>
                  </span>
                  
                  {result.category && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                      {result.category.replace('_', ' ')}
                    </span>
                  )}
                  
                  {result.articleReference && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      📖 {result.articleReference}
                    </span>
                  )}
                </div>
              </div>
              
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-4 px-4 py-2 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white rounded-lg hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 transition-all duration-200 flex items-center space-x-2 text-sm font-medium"
              >
                <span>Consulter</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        ))}
      </div>
      
      {results.length > 5 && (
        <div className="text-center text-sm text-gray-500">
          Et {results.length - 5} autres résultats...
        </div>
      )}
    </div>
  );
};

export default LegalSearchResults;
