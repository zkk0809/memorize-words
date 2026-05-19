import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let client = null;

export function getSupabaseAdmin() {
  if (!client) {
    client = createClient(supabaseUrl, supabaseKey);
  }
  return client;
}