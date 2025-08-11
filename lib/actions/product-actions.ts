'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // Adjust path as needed
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

interface UpdateProductResult {
  success: boolean;
  product?: {
    id: string;
    name: string;
    category: string;
    serial_number: string;
    order_number: string;
    notes: string;
  };
  error?: string;
}

export async function updateProductDetails(formData: FormData): Promise<UpdateProductResult> {
  try {
    // SECURITY CHECK: Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized: Please log in to update product details'
      };
    }

    // Extract and validate form data
    const productId = formData.get('productId') as string;
    const serial_number = formData.get('serial_number') as string;
    const order_number = formData.get('order_number') as string;
    const notes = formData.get('notes') as string;

    // Validate required fields
    if (!productId) {
      return {
        success: false,
        error: 'Product ID is required'
      };
    }

    if (!serial_number?.trim() || !order_number?.trim()) {
      return {
        success: false,
        error: 'Both serial number and order number are required'
      };
    }

    // Sanitize inputs
    const sanitizedData = {
      serial_number: serial_number.trim().slice(0, 50),
      order_number: order_number.trim().slice(0, 50),
      notes: notes?.trim().slice(0, 500) || null,
    };

    // CRITICAL SECURITY: Verify user owns the product
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('id, name, category, user_id')
      .eq('id', productId)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError) {
      console.error('Product fetch error:', fetchError);
      return {
        success: false,
        error: 'Product not found or access denied'
      };
    }

    if (!existingProduct) {
      return {
        success: false,
        error: 'Product not found or you do not have permission to edit it'
      };
    }

    // Check for duplicate serial numbers (optional business rule)
    const { data: duplicateCheck } = await supabase
      .from('products')
      .select('id')
      .eq('serial_number', sanitizedData.serial_number)
      .neq('id', productId)
      .limit(1);

    if (duplicateCheck && duplicateCheck.length > 0) {
      return {
        success: false,
        error: 'This serial number is already registered to another product'
      };
    }

    // Update the product in Supabase
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({
        serial_number: sanitizedData.serial_number,
        order_number: sanitizedData.order_number,
        notes: sanitizedData.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .eq('user_id', session.user.id) // Double-check ownership
      .select('id, name, category, serial_number, order_number, notes')
      .single();

    if (updateError) {
      console.error('Product update error:', updateError);
      return {
        success: false,
        error: 'Failed to update product details. Please try again.'
      };
    }

    // Revalidate relevant pages to show updated data
    revalidatePath('/dashboard');
    revalidatePath(`/products/${productId}`);

    // Log successful update for analytics/debugging
    console.log('Product updated successfully:', {
      productId,
      userId: session.user.id,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      product: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        category: updatedProduct.category,
        serial_number: updatedProduct.serial_number || '',
        order_number: updatedProduct.order_number || '',
        notes: updatedProduct.notes || '',
      }
    };

  } catch (error) {
    console.error('Unexpected error in updateProductDetails:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again later.'
    };
  }
}