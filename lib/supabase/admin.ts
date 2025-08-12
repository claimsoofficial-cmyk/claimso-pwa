// file: lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js';

// This client is for server-side operations during build time or in contexts
// where there is no user request (e.g., cron jobs, build scripts).
// It uses the SERVICE_ROLE_KEY to bypass RLS.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);