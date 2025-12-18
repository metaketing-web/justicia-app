import React, { useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { AFRICAN_COUNTRIES, DOCUMENT_TYPES, LEGAL_DOMAINS, LegalSearchFilters as Filters } from '../services/legalRAG.service';

interface LegalSearchFiltersProps {
  onFiltersChange: (filters: Filters) => void;
}

const LegalSearchFilters: React.FC<LegalSearchFiltersProps> = ({ onFiltersChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [ohadaFilter, setOhadaFilter] = useState<'all' | 'yes' | 'no'>('all');

  const handleCountryToggle = (code: string) => {
    const newCountries = selectedCountries.includes(code)
      ? selectedCountries.filter(c => c !== code)
      : [...selectedCountries, code];
    setSelectedCountries(newCountries);
    updateFilters({ countries: newCountries });
  };

  const handleTypeToggle = (type: string) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type];
    setSelectedTypes(newTypes);
    updateFilters({ documentTypes: newTypes });
  };

  const handleDomainToggle = (domain: string) => {
    const newDomains = selectedDomains.includes(domain)
      ? selectedDomains.filter(d => d !== domain)
      : [...selectedDomains, domain];
    setSelectedDomains(newDomains);
    updateFilters({ domains: newDomains });
  };

  const handleOhadaChange = (value: 'all' | 'yes' | 'no') => {
    setOhadaFilter(value);
    updateFilters({ ohadaOnly: value === 'yes' ? true : undefined });
  };

  const updateFilters = (partialFilters: Partial<Filters>) => {
    const filters: Filters = {
      countries: selectedCountries.length > 0 ? selectedCountries : undefined,
      documentTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
      domains: selectedDomains.length > 0 ? selectedDomains : undefined,
      ohadaOnly: ohadaFilter === 'yes' ? true : undefined,
      inForceOnly: true, // Toujours activer
      ...partialFilters,
    };
    onFiltersChange(filters);
  };

  const clearAllFilters = () => {
    setSelectedCountries([]);
    setSelectedTypes([]);
    setSelectedDomains([]);
    setOhadaFilter('all');
    onFiltersChange({});
  };

  const activeFiltersCount = selectedCountries.length + selectedTypes.length + selectedDomains.length + (ohadaFilter !== 'all' ? 1 : 0);

  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-white hover:text-purple-400 transition-colors"
        >
          <Filter className="w-5 h-5" />
          <span className="font-semibold">Filtres de Recherche Juridique</span>
          {activeFiltersCount > 0 && (
            <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
              {activeFiltersCount} Actifs
            </span>
          )}
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {activeFiltersCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
            Effacer
          </button>
        )}
      </div>

      {/* Filters Content */}
      {isExpanded && (
        <div className="space-y-4 pt-3 border-t border-neutral-800">
          {/* Pays */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">🌍 Pays</h4>
            <div className="flex flex-wrap gap-2">
              {AFRICAN_COUNTRIES.map(country => (
                <button
                  key={country.code}
                  onClick={() => handleCountryToggle(country.code)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    selectedCountries.includes(country.code)
                      ? 'bg-purple-600 text-white'
                      : 'bg-neutral-800 text-gray-300 hover:bg-neutral-700'
                  }`}
                >
                  {country.flag} {country.name}
                </button>
              ))}
            </div>
          </div>

          {/* Type de Document */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">📚 Type de Document</h4>
            <div className="flex flex-wrap gap-2">
              {DOCUMENT_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => handleTypeToggle(type)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    selectedTypes.includes(type)
                      ? 'bg-purple-600 text-white'
                      : 'bg-neutral-800 text-gray-300 hover:bg-neutral-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Domaine Juridique */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">⚖️ Domaine Juridique</h4>
            <div className="flex flex-wrap gap-2">
              {LEGAL_DOMAINS.map(domain => (
                <button
                  key={domain}
                  onClick={() => handleDomainToggle(domain)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    selectedDomains.includes(domain)
                      ? 'bg-purple-600 text-white'
                      : 'bg-neutral-800 text-gray-300 hover:bg-neutral-700'
                  }`}
                >
                  {domain}
                </button>
              ))}
            </div>
          </div>

          {/* OHADA */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">🏛️ OHADA</h4>
            <div className="flex gap-2">
              <button
                onClick={() => handleOhadaChange('all')}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  ohadaFilter === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-neutral-800 text-gray-300 hover:bg-neutral-700'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => handleOhadaChange('yes')}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  ohadaFilter === 'yes'
                    ? 'bg-purple-600 text-white'
                    : 'bg-neutral-800 text-gray-300 hover:bg-neutral-700'
                }`}
              >
                Applicable
              </button>
              <button
                onClick={() => handleOhadaChange('no')}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  ohadaFilter === 'no'
                    ? 'bg-purple-600 text-white'
                    : 'bg-neutral-800 text-gray-300 hover:bg-neutral-700'
                }`}
              >
                Non applicable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LegalSearchFilters;
