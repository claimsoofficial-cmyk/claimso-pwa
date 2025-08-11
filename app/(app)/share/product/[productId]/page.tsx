import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Camera,
  ArrowRight,
  Star
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,

} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@supabase/supabase-js';

// Create Supabase service role client for server-side queries
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key for server-side access
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Public-safe product data structure
interface PublicProduct {
  id: string;
  product_name: string;
  brand: string | null;
  category: string | null;
  condition: 'new' | 'used' | 'refurbished' | 'damaged';
  warranties: {
    id: string;
    warranty_type: 'manufacturer' | 'extended' | 'store' | 'insurance';
    snapshot_data: {
      covers?: string[];
      does_not_cover?: string[];
      key_terms?: string[];
    };
    ai_confidence_score: number | null;
  }[] | null;
  documents: {
    id: string;
    file_url: string;
    document_type: 'receipt' | 'warranty_pdf' | 'manual' | 'insurance' | 'photo' | 'other';
    is_primary: boolean;
  }[] | null;
}


/**
 * Fetch public product data using service role client
 */
async function getPublicProduct(productId: string): Promise<PublicProduct | null> {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        id,
        product_name,
        brand,
        category,
        condition,
        warranties:warranties (
          id,
          warranty_type,
          snapshot_data,
          ai_confidence_score
        ),
        documents:documents (
          id,
          file_url,
          document_type,
          is_primary
        )
      `)
      .eq('id', productId)
      .single();

    if (error) {
      console.error('Error fetching public product:', error);
      return null;
    }

    return product;
  } catch (error) {
    console.error('Error in getPublicProduct:', error);
    return null;
  }
}

/**
 * Public Product Share Page
 * Displays a read-only, non-sensitive version of a product card
 */
export default async function PublicProductSharePage({ params }: { params: { productId: string } }) {
  const { productId } = params;


  // Validate productId format (basic UUID check)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(productId)) {
    notFound();
  }

  // Fetch public product data
  const product = await getPublicProduct(productId);

  if (!product) {
    notFound();
  }

  // Extract public-safe data
  const primaryWarranty = product.warranties?.[0];
  const primaryImage = product.documents?.find(doc => 
    doc.document_type === 'photo' && doc.is_primary
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-6 h-6 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">CLAIMSO</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Shared Product Information
          </h1>
          <p className="text-gray-600">
            A CLAIMSO user has shared their product warranty details with you
          </p>
        </div>

        {/* Public Product Card */}
        <Card className="mb-8 shadow-lg">
          {/* Product Image */}
          <CardHeader className="p-0">
            <div className="relative h-64 bg-gray-100 rounded-t-lg overflow-hidden">
              {primaryImage ? (
                <Image
                  src={primaryImage.file_url}
                  alt={product.product_name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Camera className="w-12 h-12 text-gray-400" />
                  <span className="text-gray-500 ml-3">No image available</span>
                </div>
              )}
              
              {/* Condition Badge */}
              <div className="absolute top-4 right-4">
                <Badge variant="secondary" className="bg-white/90 text-gray-700">
                  {product.condition.charAt(0).toUpperCase() + product.condition.slice(1)}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Product Details */}
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-gray-900">
                {product.product_name}
              </h2>
              <div className="flex items-center gap-4 text-gray-600">
                {product.brand && (
                  <span className="font-medium text-lg">{product.brand}</span>
                )}
                {product.category && (
                  <Badge variant="outline">{product.category}</Badge>
                )}
              </div>
            </div>

            {/* AI Warranty Snapshot */}
            {primaryWarranty?.snapshot_data && (
              <div className="space-y-4">
                <Separator />
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <span className="text-lg font-semibold text-gray-900">
                      AI Warranty Analysis
                    </span>
                    {primaryWarranty.ai_confidence_score && (
                      <Badge variant="outline" className="text-sm">
                        {Math.round(primaryWarranty.ai_confidence_score * 100)}% confident
                      </Badge>
                    )}
                  </div>

                  {/* Coverage Details */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {primaryWarranty.snapshot_data.covers && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-green-700 font-medium">
                          <CheckCircle2 className="w-4 h-4" />
                          What&apos;s Covered
                        </div>
                        <ul className="space-y-2 text-sm text-gray-700">
                          {primaryWarranty.snapshot_data.covers.slice(0, 4).map((item, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {primaryWarranty.snapshot_data.does_not_cover && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-red-700 font-medium">
                          <XCircle className="w-4 h-4" />
                          Not Covered
                        </div>
                        <ul className="space-y-2 text-sm text-gray-700">
                          {primaryWarranty.snapshot_data.does_not_cover.slice(0, 3).map((item, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Key Terms */}
                  {primaryWarranty.snapshot_data.key_terms && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">Key Terms</h4>
                      <div className="flex flex-wrap gap-2">
                        {primaryWarranty.snapshot_data.key_terms.slice(0, 6).map((term, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {term}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Warranty Type */}
            {primaryWarranty && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="w-4 h-4" />
                <span>
                  {primaryWarranty.warranty_type.charAt(0).toUpperCase() + 
                   primaryWarranty.warranty_type.slice(1)} Warranty
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Call to Action Section */}
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Star className="w-6 h-6 text-yellow-400" />
                  <Star className="w-6 h-6 text-yellow-400" />
                  <Star className="w-6 h-6 text-yellow-400" />
                  <Star className="w-6 h-6 text-yellow-400" />
                  <Star className="w-6 h-6 text-yellow-400" />
                </div>
                <h3 className="text-2xl font-bold">
                  Track your own purchases with the same clarity
                </h3>
                <p className="text-blue-100 text-lg max-w-lg mx-auto">
                  Get AI-powered warranty analysis, smart reminders, and organized 
                  product management for all your purchases.
                </p>
              </div>

              <div className="space-y-3">
                <Button 
                  asChild
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-50 font-semibold px-8 py-3 text-lg"
                >
                  <Link href="/">
                    Get your free CLAIMSO vault
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <p className="text-blue-200 text-sm">
                  Free forever • No credit card required • Set up in 2 minutes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>
            Powered by{' '}
            <Link href="/" className="text-blue-600 hover:underline font-medium">
              CLAIMSO
            </Link>{' '}
            - Smart warranty management for everyone
          </p>
        </div>
      </div>
    </div>
  );
}