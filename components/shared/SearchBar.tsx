'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Package, Shield, FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface SearchResult {
  id: string;
  type: 'product' | 'warranty' | 'claim';
  title: string;
  subtitle: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export default function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery('');
        setResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : results.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            window.location.href = results[selectedIndex].href;
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setQuery('');
          setResults([]);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Search function
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const searchResults: SearchResult[] = [];

      // Search products
      const { data: products } = await supabase
        .from('products')
        .select('id, product_name, brand, category')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .ilike('product_name', `%${searchQuery}%`)
        .limit(5);

      if (products) {
        products.forEach(product => {
          searchResults.push({
            id: product.id,
            type: 'product',
            title: product.product_name,
            subtitle: `${product.brand || 'Unknown Brand'} • ${product.category || 'Uncategorized'}`,
            href: `/products/${product.id}`,
            icon: Package,
            badge: 'Product'
          });
        });
      }

      // Search warranties
      const { data: warranties } = await supabase
        .from('warranties')
        .select('id, warranty_type, coverage_details, products(product_name)')
        .ilike('coverage_details', `%${searchQuery}%`)
        .limit(3);

      if (warranties) {
        warranties.forEach(warranty => {
          searchResults.push({
            id: warranty.id,
            type: 'warranty',
            title: `${warranty.warranty_type} Warranty`,
            subtitle: warranty.products?.product_name || 'Unknown Product',
            href: `/warranties/${warranty.id}`,
            icon: Shield,
            badge: 'Warranty'
          });
        });
      }

      // Search claims
      const { data: claims } = await supabase
        .from('claims')
        .select('id, claim_type, status, products(product_name)')
        .eq('user_id', user.id)
        .ilike('claim_type', `%${searchQuery}%`)
        .limit(3);

      if (claims) {
        claims.forEach(claim => {
          searchResults.push({
            id: claim.id,
            type: 'claim',
            title: `${claim.claim_type} Claim`,
            subtitle: claim.products?.product_name || 'Unknown Product',
            href: `/claims/${claim.id}`,
            icon: FileText,
            badge: claim.status
          });
        });
      }

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(-1);
    if (e.target.value) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    window.location.href = result.href;
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  const getBadgeVariant = (badge: string) => {
    switch (badge.toLowerCase()) {
      case 'pending':
        return 'secondary';
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div ref={searchRef} className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search products, warranties, claims..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (query) setIsOpen(true);
          }}
          className="pl-9 pr-9 w-full"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result, index) => {
                const Icon = result.icon;
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className={cn(
                      "w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3",
                      selectedIndex === index && "bg-blue-50"
                    )}
                  >
                    <div className="flex-shrink-0">
                      <Icon className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {result.title}
                        </p>
                        <Badge variant={getBadgeVariant(result.badge || '')} className="text-xs">
                          {result.badge}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {result.subtitle}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          ) : query ? (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">No results found for &quot;{query}&quot;</p>
              <p className="text-xs mt-1">Try searching for a different term</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
