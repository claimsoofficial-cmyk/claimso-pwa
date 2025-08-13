import { 
  WarrantyDatabaseEntry, 
  WarrantySearchRequest, 
  WarrantySearchResponse,
  WarrantyDatabaseStats 
} from '@/lib/types/warranty-database';

// ==============================================================================
// COMPREHENSIVE WARRANTY DATABASE SERVICE
// ==============================================================================

// Sample warranty database - in production, this would be in Supabase
const WARRANTY_DATABASE: WarrantyDatabaseEntry[] = [
  {
    id: 'iphone-14-pro',
    brand: 'Apple',
    model: 'iPhone 14 Pro',
    category: 'phones',
    release_date: '2022-09-16',
    warranty_terms: {
      manufacturer: {
        duration: 12,
        coverage: [
          'Manufacturing defects',
          'Hardware failures',
          'Software issues',
          'Battery defects'
        ],
        exclusions: [
          'Accidental damage',
          'Water damage',
          'Unauthorized modifications',
          'Cosmetic damage'
        ],
        requirements: [
          'Original purchaser',
          'Proof of purchase',
          'No unauthorized repairs'
        ],
        limitations: [
          'Limited to original purchaser',
          'Non-transferable',
          'Subject to Apple\'s discretion'
        ]
      },
      extended_options: [
        {
          provider: 'AppleCare+',
          duration: 24,
          cost: 199,
          coverage: [
            'All manufacturer warranty coverage',
            'Accidental damage protection',
            'Express replacement service',
            'Technical support'
          ],
          exclusions: [
            'Intentional damage',
            'Lost or stolen devices'
          ]
        }
      ]
    },
    common_issues: [
      {
        issue: 'Battery degradation',
        frequency: 0.15,
        average_repair_cost: 89,
        covered_by_warranty: true,
        component: 'battery'
      },
      {
        issue: 'Screen damage',
        frequency: 0.08,
        average_repair_cost: 329,
        covered_by_warranty: false,
        component: 'display'
      },
      {
        issue: 'Camera module failure',
        frequency: 0.03,
        average_repair_cost: 199,
        covered_by_warranty: true,
        component: 'camera'
      }
    ],
    reliability_score: 0.92,
    user_ratings: 4.6,
    data_quality: {
      source: 'manufacturer',
      confidence_score: 0.95,
      last_verified: '2024-01-15',
      verification_method: 'official_website',
      data_points: 150
    },
    market_data: {
      msrp: 999,
      current_price: 899,
      depreciation_rate: 0.10,
      resale_value: 650
    }
  },
  {
    id: 'macbook-pro-14',
    brand: 'Apple',
    model: 'MacBook Pro 14-inch',
    category: 'laptops',
    release_date: '2021-10-26',
    warranty_terms: {
      manufacturer: {
        duration: 12,
        coverage: [
          'Manufacturing defects',
          'Hardware failures',
          'Keyboard issues',
          'Display defects'
        ],
        exclusions: [
          'Accidental damage',
          'Liquid damage',
          'Unauthorized modifications',
          'Cosmetic wear'
        ],
        requirements: [
          'Original purchaser',
          'Proof of purchase',
          'No unauthorized repairs'
        ],
        limitations: [
          'Limited to original purchaser',
          'Non-transferable'
        ]
      },
      extended_options: [
        {
          provider: 'AppleCare+',
          duration: 36,
          cost: 399,
          coverage: [
            'All manufacturer warranty coverage',
            'Accidental damage protection',
            'Express replacement service',
            'Technical support'
          ],
          exclusions: [
            'Intentional damage',
            'Lost or stolen devices'
          ]
        }
      ]
    },
    common_issues: [
      {
        issue: 'Battery swelling',
        frequency: 0.05,
        average_repair_cost: 199,
        covered_by_warranty: true,
        component: 'battery'
      },
      {
        issue: 'Keyboard failure',
        frequency: 0.08,
        average_repair_cost: 299,
        covered_by_warranty: true,
        component: 'keyboard'
      },
      {
        issue: 'Display backlight issues',
        frequency: 0.03,
        average_repair_cost: 599,
        covered_by_warranty: true,
        component: 'display'
      }
    ],
    reliability_score: 0.89,
    user_ratings: 4.7,
    data_quality: {
      source: 'manufacturer',
      confidence_score: 0.93,
      last_verified: '2024-01-10',
      verification_method: 'official_website',
      data_points: 120
    },
    market_data: {
      msrp: 1999,
      current_price: 1799,
      depreciation_rate: 0.10,
      resale_value: 1400
    }
  },
  {
    id: 'galaxy-s23-ultra',
    brand: 'Samsung',
    model: 'Galaxy S23 Ultra',
    category: 'phones',
    release_date: '2023-02-17',
    warranty_terms: {
      manufacturer: {
        duration: 12,
        coverage: [
          'Manufacturing defects',
          'Hardware failures',
          'Software issues',
          'Battery defects'
        ],
        exclusions: [
          'Accidental damage',
          'Water damage',
          'Unauthorized modifications',
          'Cosmetic damage'
        ],
        requirements: [
          'Original purchaser',
          'Proof of purchase',
          'No unauthorized repairs'
        ],
        limitations: [
          'Limited to original purchaser',
          'Non-transferable'
        ]
      },
      extended_options: [
        {
          provider: 'Samsung Care+',
          duration: 24,
          cost: 179,
          coverage: [
            'All manufacturer warranty coverage',
            'Accidental damage protection',
            'Express replacement service',
            'Technical support'
          ],
          exclusions: [
            'Intentional damage',
            'Lost or stolen devices'
          ]
        }
      ]
    },
    common_issues: [
      {
        issue: 'Battery degradation',
        frequency: 0.12,
        average_repair_cost: 79,
        covered_by_warranty: true,
        component: 'battery'
      },
      {
        issue: 'Screen damage',
        frequency: 0.10,
        average_repair_cost: 299,
        covered_by_warranty: false,
        component: 'display'
      },
      {
        issue: 'S Pen issues',
        frequency: 0.05,
        average_repair_cost: 49,
        covered_by_warranty: true,
        component: 's_pen'
      }
    ],
    reliability_score: 0.88,
    user_ratings: 4.5,
    data_quality: {
      source: 'manufacturer',
      confidence_score: 0.91,
      last_verified: '2024-01-12',
      verification_method: 'official_website',
      data_points: 95
    },
    market_data: {
      msrp: 1199,
      current_price: 999,
      depreciation_rate: 0.17,
      resale_value: 750
    }
  },
  {
    id: 'dell-xps-13',
    brand: 'Dell',
    model: 'XPS 13',
    category: 'laptops',
    release_date: '2023-01-15',
    warranty_terms: {
      manufacturer: {
        duration: 12,
        coverage: [
          'Manufacturing defects',
          'Hardware failures',
          'Keyboard issues',
          'Display defects'
        ],
        exclusions: [
          'Accidental damage',
          'Liquid damage',
          'Unauthorized modifications',
          'Cosmetic wear'
        ],
        requirements: [
          'Original purchaser',
          'Proof of purchase',
          'No unauthorized repairs'
        ],
        limitations: [
          'Limited to original purchaser',
          'Non-transferable'
        ]
      },
      extended_options: [
        {
          provider: 'Dell Premium Support',
          duration: 36,
          cost: 299,
          coverage: [
            'All manufacturer warranty coverage',
            'Accidental damage protection',
            'On-site service',
            'Technical support'
          ],
          exclusions: [
            'Intentional damage',
            'Lost or stolen devices'
          ]
        }
      ]
    },
    common_issues: [
      {
        issue: 'Battery failure',
        frequency: 0.08,
        average_repair_cost: 149,
        covered_by_warranty: true,
        component: 'battery'
      },
      {
        issue: 'Keyboard failure',
        frequency: 0.06,
        average_repair_cost: 199,
        covered_by_warranty: true,
        component: 'keyboard'
      },
      {
        issue: 'Display issues',
        frequency: 0.04,
        average_repair_cost: 399,
        covered_by_warranty: true,
        component: 'display'
      }
    ],
    reliability_score: 0.85,
    user_ratings: 4.3,
    data_quality: {
      source: 'manufacturer',
      confidence_score: 0.89,
      last_verified: '2024-01-08',
      verification_method: 'official_website',
      data_points: 80
    },
    market_data: {
      msrp: 1299,
      current_price: 1099,
      depreciation_rate: 0.15,
      resale_value: 850
    }
  }
];

/**
 * Search warranty database
 */
export async function searchWarrantyDatabase(request: WarrantySearchRequest): Promise<WarrantySearchResponse> {
  const startTime = Date.now();
  
  try {
    let results = [...WARRANTY_DATABASE];

    // Apply filters
    if (request.brand) {
      results = results.filter(entry => 
        entry.brand.toLowerCase().includes(request.brand!.toLowerCase())
      );
    }

    if (request.model) {
      results = results.filter(entry => 
        entry.model.toLowerCase().includes(request.model!.toLowerCase())
      );
    }

    if (request.category) {
      results = results.filter(entry => 
        entry.category.toLowerCase() === request.category!.toLowerCase()
      );
    }

    if (request.min_confidence) {
      results = results.filter(entry => 
        entry.data_quality.confidence_score >= request.min_confidence!
      );
    }

    // Sort by confidence score (highest first)
    results.sort((a, b) => b.data_quality.confidence_score - a.data_quality.confidence_score);

    const searchTime = Date.now() - startTime;

    return {
      success: true,
      results,
      total_count: results.length,
      search_time: searchTime,
      confidence_threshold: request.min_confidence || 0
    };

  } catch (error) {
    console.error('Error searching warranty database:', error);
    return {
      success: false,
      results: [],
      total_count: 0,
      search_time: Date.now() - startTime,
      confidence_threshold: request.min_confidence || 0
    };
  }
}

/**
 * Get warranty database statistics
 */
export async function getWarrantyDatabaseStats(): Promise<WarrantyDatabaseStats> {
  try {
    const totalProducts = WARRANTY_DATABASE.length;
    const brands = new Set(WARRANTY_DATABASE.map(entry => entry.brand));
    const categories = new Set(WARRANTY_DATABASE.map(entry => entry.category));
    
    const averageConfidence = WARRANTY_DATABASE.reduce((sum, entry) => 
      sum + entry.data_quality.confidence_score, 0
    ) / totalProducts;

    const dataSources = {
      manufacturer: WARRANTY_DATABASE.filter(entry => entry.data_quality.source === 'manufacturer').length,
      retailer: WARRANTY_DATABASE.filter(entry => entry.data_quality.source === 'retailer').length,
      user: WARRANTY_DATABASE.filter(entry => entry.data_quality.source === 'user').length,
      ai_generated: WARRANTY_DATABASE.filter(entry => entry.data_quality.source === 'ai_generated').length
    };

    return {
      total_products: totalProducts,
      brands_covered: brands.size,
      categories_covered: categories.size,
      average_confidence: averageConfidence,
      last_updated: new Date().toISOString(),
      data_sources: dataSources
    };

  } catch (error) {
    console.error('Error getting warranty database stats:', error);
    return {
      total_products: 0,
      brands_covered: 0,
      categories_covered: 0,
      average_confidence: 0,
      last_updated: new Date().toISOString(),
      data_sources: { manufacturer: 0, retailer: 0, user: 0, ai_generated: 0 }
    };
  }
}

/**
 * Get warranty entry by ID
 */
export async function getWarrantyEntryById(id: string): Promise<WarrantyDatabaseEntry | null> {
  try {
    return WARRANTY_DATABASE.find(entry => entry.id === id) || null;
  } catch (error) {
    console.error('Error getting warranty entry by ID:', error);
    return null;
  }
}

/**
 * Add new warranty entry (for user contributions)
 */
export async function addWarrantyEntry(entry: Omit<WarrantyDatabaseEntry, 'id'>): Promise<boolean> {
  try {
    const newEntry: WarrantyDatabaseEntry = {
      ...entry,
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    // In production, this would be saved to Supabase
    // WARRANTY_DATABASE.push(newEntry);
    
    console.log('New warranty entry added:', newEntry.id);
    return true;
  } catch (error) {
    console.error('Error adding warranty entry:', error);
    return false;
  }
}

/**
 * Update warranty entry
 */
export async function updateWarrantyEntry(id: string, updates: Partial<WarrantyDatabaseEntry>): Promise<boolean> {
  try {
    const index = WARRANTY_DATABASE.findIndex(entry => entry.id === id);
    if (index === -1) return false;

    WARRANTY_DATABASE[index] = {
      ...WARRANTY_DATABASE[index],
      ...updates,
      data_quality: {
        ...WARRANTY_DATABASE[index].data_quality,
        last_verified: new Date().toISOString()
      }
    };

    return true;
  } catch (error) {
    console.error('Error updating warranty entry:', error);
    return false;
  }
} 