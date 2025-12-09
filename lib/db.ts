import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!supabaseUrl) {
  console.error('[DB] Missing NEXT_PUBLIC_SUPABASE_URL');
}
if (!supabaseAnonKey) {
  console.error('[DB] Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
}
if (!supabaseServiceRoleKey && typeof window === 'undefined') {
  console.error('[DB] Missing SUPABASE_SERVICE_ROLE_KEY (server-side only)');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;

// Only create supabaseAdmin on the server side
// In Next.js API routes, window is always undefined
export const supabaseAdmin =
  typeof window === 'undefined' && supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : undefined;

// Debug logging (only on server)
if (typeof window === 'undefined') {
  console.log('[DB] Server-side initialization:', {
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    hasServiceRoleKey: !!supabaseServiceRoleKey,
    supabaseAdminCreated: !!supabaseAdmin,
  });
}
