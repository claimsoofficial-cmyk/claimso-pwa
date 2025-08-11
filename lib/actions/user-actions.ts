'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signOut } from 'next-auth/react';

/**
 * Update user profile information
 * @param formData - Form data containing the full_name field
 * @returns Success indicator
 */
export async function updateUserProfile(formData: FormData) {
  try {
    // Get authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new Error('Unauthorized: No valid session found');
    }

    // Extract and validate form data
    const fullName = formData.get('full_name')?.toString()?.trim();
    
    if (!fullName) {
      throw new Error('Full name is required');
    }

    if (fullName.length < 1 || fullName.length > 100) {
      throw new Error('Full name must be between 1 and 100 characters');
    }

    // Update user profile in database
    await db.profile.update({
      where: { 
        user_id: session.user.id 
      },
      data: { 
        full_name: fullName,
        updated_at: new Date()
      }
    });

    // Revalidate the settings page to reflect changes
    revalidatePath('/settings/account');
    
    return { success: true };
    
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update profile'
    };
  }
}

/**
 * Export all user data as JSON
 * @returns Success indicator with data payload
 */
export async function exportUserData() {
  try {
    // Get authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new Error('Unauthorized: No valid session found');
    }

    const userId = session.user.id;

    // Fetch all user-related data
    const [profile, products] = await Promise.all([
      // Get user profile
      db.profile.findUnique({
        where: { user_id: userId },
        select: {
          id: true,
          user_id: true,
          full_name: true,
          created_at: true,
          updated_at: true
        }
      }),
      
      // Get all products with nested warranties and documents
      db.product.findMany({
        where: { user_id: userId },
        include: {
          warranties: {
            select: {
              id: true,
              warranty_start_date: true,
              warranty_end_date: true,
              warranty_duration_months: true,
              warranty_type: true,
              coverage_details: true,
              claim_process: true,
              contact_info: true,
              snapshot_data: true,
              ai_confidence_score: true,
              last_analyzed_at: true,
              created_at: true,
              updated_at: true
            }
          },
          documents: {
            select: {
              id: true,
              file_name: true,
              file_url: true,
              file_type: true,
              document_type: true,
              description: true,
              is_primary: true,
              upload_date: true,
              created_at: true
            }
          }
        }
      })
    ]);

    // Compile export data
    const exportData = {
      export_metadata: {
        export_date: new Date().toISOString(),
        user_id: userId,
        version: '1.0'
      },
      profile: profile,
      products: products,
      summary: {
        total_products: products.length,
        total_warranties: products.reduce((sum, p) => sum + (p.warranties?.length || 0), 0),
        total_documents: products.reduce((sum, p) => sum + (p.documents?.length || 0), 0)
      }
    };

    // Convert to formatted JSON string
    const jsonData = JSON.stringify(exportData, null, 2);
    
    return { 
      success: true, 
      data: jsonData
    };
    
  } catch (error) {
    console.error('Error exporting user data:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to export data'
    };
  }
}

/**
 * Delete user account and all associated data
 * This is a critical operation that permanently removes the user
 */
export async function deleteUserAccount() {
  try {
    // Get authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new Error('Unauthorized: No valid session found');
    }

    const userId = session.user.id;

    // Create Supabase admin client for user deletion
    const supabaseAdmin = supabase;

    // Step 1: Delete user from Supabase Auth
    // This will trigger CASCADE deletes for profile, products, warranties, and documents
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (deleteError) {
      console.error('Supabase user deletion error:', deleteError);
      throw new Error(`Failed to delete user account: ${deleteError.message}`);
    }

    // Step 2: Clean up any remaining database records (redundant due to CASCADE, but safe)
    try {
      await db.profile.delete({
        where: { user_id: userId }
      });
    } catch (dbError) {
      // This might fail if already deleted by CASCADE, which is fine
      console.log('Profile cleanup completed or already handled by CASCADE');
    }

    // Step 3: Sign out user and redirect to homepage
    // Note: We can't use signOut() here as it's a client-side function
    // The redirect will handle the sign out process
    redirect('/?account-deleted=true');
    
  } catch (error) {
    console.error('Error deleting user account:', error);
    
    // If we're already in a redirect, don't throw
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      return;
    }
    
    throw new Error(
      error instanceof Error ? error.message : 'Failed to delete account'
    );
  }
}