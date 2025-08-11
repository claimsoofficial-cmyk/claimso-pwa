
import { redirect } from 'next/navigation';
import { Package, Plus, Shield, Smartphone } from 'lucide-react';
import ResolutionManager from '@/components/domain/resolution/ResolutionManager';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';

// ==============================================================================
// TYPESCRIPT INTERFACES
// ==============================================================================

/**
 * Extended product type with nested warranties and documents from database
 */
interface ProductWithRelations {
  id: string;
  user_id: string;
  product_name: string;
  brand: string | null;
  model: string | null;
  category: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  currency: string;
  purchase_location: string | null;
  serial_number: string | null;
  condition: 'new' | 'used' | 'refurbished' | 'damaged';
  notes: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  warranties: Array<{
    id: string;
    warranty_start_date: string | null;
    warranty_end_date: string | null;
    warranty_duration_months: number | null;
    warranty_type: 'manufacturer' | 'extended' | 'store' | 'insurance';
    coverage_details: string | null;
    claim_process: string | null;
    contact_info: string | null;
    snapshot_data: {
      covers?: string[];
      does_not_cover?: string[];
      key_terms?: string[];
      claim_requirements?: string[];
    };
    ai_confidence_score: number | null;
    last_analyzed_at: string | null;
  }>;
  documents: Array<{
    id: string;
    file_name: string;
    file_url: string;
    file_type: string | null;
    document_type: 'receipt' | 'warranty_pdf' | 'manual' | 'insurance' | 'photo' | 'other';
    description: string | null;
    is_primary: boolean;
    upload_date: string;
  }>;
}

// ==============================================================================
// SERVER COMPONENT - DASHBOARD PAGE
// ==============================================================================

/**
 * Dashboard Page - Main authenticated user interface
 * 
 * This Server Component securely fetches user products with their warranties
 * and documents, then renders them using ResolutionManager components.
 * 
 * Security: 
 * - Server-side authentication check
 * - RLS policies ensure data isolation
 * - Automatic redirect for unauthenticated users
 */
export default async function DashboardPage() {
  // ==============================================================================
  // SERVER-SIDE AUTHENTICATION & DATA FETCHING
  // ==============================================================================
  
  // Create server-side Supabase client using centralized helper
  const supabase = createClient();

  // Check for authenticated user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // Redirect unauthenticated users to homepage
  if (authError || !user) {
    console.log('No authenticated user found, redirecting to homepage');
    redirect('/');
  }

  // Fetch user profile for display name
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  // Fetch products with nested warranties and documents in a single query
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select(`
      id,
      user_id,
      product_name,
      brand,
      model,
      category,
      purchase_date,
      purchase_price,
      currency,
      purchase_location,
      serial_number,
      condition,
      notes,
      is_archived,
      created_at,
      updated_at,
      warranties (
        id,
        warranty_start_date,
        warranty_end_date,
        warranty_duration_months,
        warranty_type,
        coverage_details,
        claim_process,
        contact_info,
        snapshot_data,
        ai_confidence_score,
        last_analyzed_at
      ),
      documents (
        id,
        file_name,
        file_url,
        file_type,
        document_type,
        description,
        is_primary,
        upload_date
      )
    `)
    .eq('user_id', user.id)
    .eq('is_archived', false)
    .order('created_at', { ascending: false });

  // Handle database query errors
  if (productsError) {
    console.error('Error fetching products:', productsError);
    // In production, you might want to show an error page instead
  }

  // Get user display name with fallback
  const displayName = profile?.full_name || user.email?.split('@')[0] || 'there';
  
  // Cast products to our typed interface
  const typedProducts = (products || []) as ProductWithRelations[];

  // ==============================================================================
  // RENDER DASHBOARD UI
  // ==============================================================================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Welcome back, {displayName}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {typedProducts.length === 0 
                  ? "Let's get started by adding your first product"
                  : `Managing ${typedProducts.length} product${typedProducts.length !== 1 ? 's' : ''}`
                }
              </p>
            </div>
            
            {/* Header Actions */}
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                className="hidden sm:flex items-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                Install Extension
              </Button>
              <Button 
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* No Products State */}
        {typedProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <Package className="w-12 h-12 text-blue-500" />
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Your vault is empty
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Connect your accounts or install our browser extension to automatically 
              import your purchases and warranties.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8"
              >
                <Shield className="w-5 h-5 mr-2" />
                Connect Account
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="px-8"
              >
                <Smartphone className="w-5 h-5 mr-2" />
                Install Extension
              </Button>
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-4">Or add your first product manually</p>
              <Button variant="ghost" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Product Manually
              </Button>
            </div>
          </div>
        ) : (
          /* Products Grid with ResolutionManager Components */
          <div>
            {/* Products Statistics */}
            <div className="mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border border-gray-100">
                  <div className="flex items-center">
                    <Package className="w-5 h-5 text-blue-500 mr-2" />
                    <div>
                      <p className="text-sm text-gray-600">Total Products</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {typedProducts.length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-gray-100">
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 text-green-500 mr-2" />
                    <div>
                      <p className="text-sm text-gray-600">Active Warranties</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {typedProducts.filter(product => 
                          product.warranties.some(warranty => 
                            warranty.warranty_end_date && 
                            new Date(warranty.warranty_end_date) > new Date()
                          )
                        ).length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-gray-100">
                  <div className="flex items-center">
                    <Package className="w-5 h-5 text-purple-500 mr-2" />
                    <div>
                      <p className="text-sm text-gray-600">Total Value</p>
                      <p className="text-xl font-semibold text-gray-900">
                        ${typedProducts
                          .reduce((sum, product) => sum + (product.purchase_price || 0), 0)
                          .toLocaleString()
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Products Grid using ResolutionManager */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {typedProducts.map((product) => (
                <ResolutionManager
                  key={product.id}
                  product={product}
                />
              ))}
            </div>

            {/* Load More Section (for pagination in the future) */}
            {typedProducts.length >= 12 && (
              <div className="text-center mt-12">
                <Button variant="outline" size="lg">
                  Load More Products
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}