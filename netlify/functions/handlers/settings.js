import { getSupabaseAdmin } from '../utils/supabase-admin.js';
import { success, error } from '../utils/response.js';

export async function handleGetSettings(event, user) {
  const supabase = getSupabaseAdmin();

  const { data, error: dbErr } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (dbErr) return error(dbErr.message);

  if (!data) {
    const { data: newSettings, error: insertErr } = await supabase
      .from('user_settings')
      .insert({ user_id: user.id })
      .select()
      .single();

    if (insertErr) return error(insertErr.message);
    return success(newSettings);
  }

  return success(data);
}

export async function handleUpdateSettings(event, user) {
  const body = JSON.parse(event.body || '{}');
  const { daily_new_limit, daily_review_limit, preferred_list, auto_pronounce, theme } = body;

  const supabase = getSupabaseAdmin();

  const { data: existing, error: fetchErr } = await supabase
    .from('user_settings')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (fetchErr) return error(fetchErr.message);

  const updates = {
    ...(daily_new_limit !== undefined && { daily_new_limit }),
    ...(daily_review_limit !== undefined && { daily_review_limit }),
    ...(preferred_list !== undefined && { preferred_list }),
    ...(auto_pronounce !== undefined && { auto_pronounce }),
    ...(theme !== undefined && { theme }),
    updated_at: new Date().toISOString()
  };

  if (existing) {
    const { data, error: dbErr } = await supabase
      .from('user_settings')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (dbErr) return error(dbErr.message);
    return success(data);
  } else {
    const { data, error: dbErr } = await supabase
      .from('user_settings')
      .insert({ user_id: user.id, ...updates })
      .select()
      .single();

    if (dbErr) return error(dbErr.message);
    return success(data);
  }
}