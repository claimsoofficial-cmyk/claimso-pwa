// file: lib/actions/product-actions.ts

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server'; // Correct import for our server client
import { cookies } from 'next/headers';

interface UpdateProductResult {
  success: boolean;
  product?: {
    id: string;
    // ... other fields are fine, but let's keep it simple for the return type
  };
  error?: string;
}

export async function updateProductDetails(formData: FormData): Promise<UpdateProductResult> {
  // Initialize Supabase client within the Server Action
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  try {
    // SECURITY CHECK: Get user session from Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return {
        success: false,
        error: 'Unauthorized: Please log in to update product details'
      };
    }
    const userId = session.user.id;

    // Extract and validate form data
    const productId = formData.get('productId') as string;
    const serial_number = formData.get('serial_number') as string;
    const order_number = formData.get('order_number') as string;
    const notes = formData.get('notes') as string;

    if (!productId) {
      return { success: false, error: 'Product ID is required' };
    }

    if (!serial_number?.trim()) {
       return { success: false, error: 'Serial number is required' };
    }
    
    // Sanitize inputs
    const sanitizedData = {
      serial_number: serial_number.trim().slice(0, 50),
      order_number: order_number?.trim().slice(0, 50) || null,
      notes: notes?.trim().slice(0, 500) || null,
    };

    // CRITICAL SECURITY: Verify user owns the product using a service role client
    // We need the service role key to check ownership without being blocked by RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    
    const { data: existingProduct, error: fetchError } = await supabaseAdmin
      .from('products')
      .select('user_id')
      .eq('id', productId)
      .single();

    if (fetchError || !existingProduct) {
      return { success: false, error: 'Product not found' };
    }

    if (existingProduct.user_id !== userId) {
      // Log security event
      console.warn(`SECURITY: User ${userId} attempted to update product ${productId} owned by ${existingProduct.user_id}`);
      return { success: false, error: 'Access denied' };
    }

    // Update the product in Supabase using the user's client (respects RLS for the update)
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({
        serial_number: sanitizedData.serial_number,
        order_number: sanitizedData.order_number,
        notes: sanitizedData.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .select('id')
      .single();

    if (updateError) {
      console.error('Product update error:', updateError);
      return { success: false, error: 'Failed to update product details.' };
    }

    // Revalidate relevant pages to show updated data
    revalidatePath('/dashboard');

    return {
      success: true,
      product: {
        id: updatedProduct.id,
      }
    };

  } catch (error) {
    console.error('Unexpected error in updateProductDetails:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}