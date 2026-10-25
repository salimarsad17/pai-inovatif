import { createClient } from '@supabase/supabase-js';

// Clean and normalize Supabase URL
const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) || (typeof process !== 'undefined' && process.env) || {};

const rawUrl =
  env.VITE_SUPABASE_URL ||
  'https://txbdicaqwjpkybhznuzw.supabase.co';

const cleanUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');

const anonKey =
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4YmRpY2Fxd2pwa3liaHpudXp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4MjUxNTUsImV4cCI6MjEwODQwMTE1NX0.jqPq_j95w41iJxaFDqlfY2-5rEf6jldrN_V1OF12-5Y';

export const SUPABASE_URL = cleanUrl;
export const SUPABASE_KEY = anonKey;

export const supabase = createClient(cleanUrl, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    cleanUrl &&
      cleanUrl.startsWith('http') &&
      anonKey &&
      anonKey.length > 20 &&
      !cleanUrl.includes('your-project')
  );
};
