import { getSupabaseAdmin } from '../utils/supabase-admin.js';
import { success, error } from '../utils/response.js';

export async function handleGetLists() {
  const supabase = getSupabaseAdmin();
  const { data, error: dbErr } = await supabase
    .from('word_lists')
    .select('id, name, description, is_public, created_by')
    .eq('is_public', true);

  if (dbErr) return error(dbErr.message);
  return success(data);
}

export async function handleCreateList(event, user) {
  const body = JSON.parse(event.body || '{}');
  const { name, description } = body;

  if (!name) return error('List name is required');

  const supabase = getSupabaseAdmin();
  const { data, error: dbErr } = await supabase
    .from('word_lists')
    .insert({
      name,
      description: description || '',
      is_public: false,
      created_by: user.id
    })
    .select()
    .single();

  if (dbErr) return error(dbErr.message);
  return success(data);
}