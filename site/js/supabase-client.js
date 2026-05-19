import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = window.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || '';

let supabase = null;

export function getSupabaseClient() {
  if (!supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabase;
}

export function initSupabase(url, anonKey) {
  window.SUPABASE_URL = url;
  window.SUPABASE_ANON_KEY = anonKey;
  SUPABASE_URL = url;
  SUPABASE_ANON_KEY = anonKey;
  supabase = createClient(url, anonKey);
  return supabase;
}