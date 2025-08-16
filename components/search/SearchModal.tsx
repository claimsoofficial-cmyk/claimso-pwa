'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIState } from '../layout/UIStateContext';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { setSearchTerm: setGlobalSearchTerm } = useUIState();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle search submission
  const handleSearch = (term: string) => {
    if (!term.trim()) return;

    // Add to recent searches
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));

    // Set global search term
    setGlobalSearchTerm(term);
    
    // Close modal and navigate to search results
    onClose();
    // TODO: Navigate to search results page
    // router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  // Handle input change with debounced suggestions
  const handleInputChange = (value: string) => {
    setSearchTerm(value);
    
    if (value.trim()) {
      setIsLoading(true);
      // Simulate API call for suggestions
      setTimeout(() => {
        const mockSuggestions = [
          `${value} warranty`,
          `${value} price`,
          `${value} review`,
          `${value} manual`,
          `${value} support`
        ];
        setSuggestions(mockSuggestions);
        setIsLoading(false);
      }, 300);
    } else {
      setSuggestions([]);
      setIsLoading(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(searchTerm);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
      <div className="flex flex-col h-full bg-white">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-9 w-9 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Search products, brands, or categories..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Recent Searches */}
          {recentSearches.length > 0 && !searchTerm && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Searches
              </h3>
              <div className="space-y-2">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(search)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-3"
                  >
                    <Clock className="h-4 w-4 text-gray-400" />
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trending Searches */}
          {!searchTerm && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Trending
              </h3>
              <div className="flex flex-wrap gap-2">
                {['iPhone warranty', 'MacBook Pro', 'Samsung TV', 'Nike shoes'].map((trend, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(trend)}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                  >
                    {trend}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Suggestions */}
          {searchTerm && suggestions.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Suggestions</h3>
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(suggestion)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-3"
                  >
                    <Search className="h-4 w-4 text-gray-400" />
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* No Results */}
          {searchTerm && !isLoading && suggestions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No suggestions found for &quot;{searchTerm}&quot;</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
