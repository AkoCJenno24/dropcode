import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

function isValidHttpUrl(str: string): boolean {
  if (!str) return false;
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export const isSupabaseConfigured = Boolean(
  isValidHttpUrl(supabaseUrl) &&
    !supabaseUrl.includes('your-project.supabase.co') &&
    supabaseAnonKey &&
    supabaseAnonKey !== 'your-anon-key'
);

let client: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    console.warn('Failed to initialize Supabase client:', e);
    client = null;
  }
}

export const supabase = client;
