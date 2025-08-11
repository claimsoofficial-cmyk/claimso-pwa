// file: lib/actions/user-actions.ts

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// --- Types for Return Values ---
interface ActionResult {
  success: boolean;
  error?: string;
}

interface ExportResult extends ActionResult {
  data?: string; // Will contain the JSON data
}

/**
 * Updates a user's full name in their profile.
 */
export async function updateUserProfile(formData: FormData): Promise<ActionResult> {
const supabase = createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const fullName = formData.get('full_name')?.toString().trim();
    if (!fullName || fullName.length > 100) {
      return { success: false, error: 'Invalid name provided.' };
    }

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) throw error;

    revalidatePath('/settings/account');
    return { success: true };

  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update profile' };
  }
}

/**
 * Exports all data for the currently authenticated user.
 */
export async function exportUserData(): Promise<ExportResult> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Fetch all data in parallel using the user's RLS-enabled client
    const { data: products, error } = await supabase
      .from('products')
      .select('*, warranties(*), documents(*)');

    if (error) throw error;

    const exportData = {
      exported_at: new Date().toISOString(),
      user_id: user.id,
      products: products || [],
    };

    return { 
      success: true, 
      data: JSON.stringify(exportData, null, 2) 
    };

  } catch (error) {
    console.error('Error exporting user data:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to export data' };
  }
}

/**
 * PERMANENTLY deletes a user's account and all associated data.
 */
export async function deleteUserAccount(): Promise<ActionResult> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // For this critical operation, we need an admin client to delete the auth user
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (error) throw error;
    
    // The ON DELETE CASCADE on our tables will handle deleting all their data.
    // We don't need to manually delete from profiles, products, etc.

  } catch (error) {
    console.error('Error deleting user account:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete account'
    };
  }

  // Redirect to the homepage after successful deletion on the server
  redirect('/?account-deleted=true');
}