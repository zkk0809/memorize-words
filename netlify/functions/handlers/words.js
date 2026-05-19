import { getSupabaseAdmin } from '../utils/supabase-admin.js';
import { success, error } from '../utils/response.js';

export async function handleGetWords(event) {
  const listId = event.pathParameters?.id || event.queryStringParameters?.list_id;
  if (!listId) return error('List ID is required');

  const page = parseInt(event.queryStringParameters?.page || '1');
  const limit = parseInt(event.queryStringParameters?.limit || '20');
  const offset = (page - 1) * limit;

  const supabase = getSupabaseAdmin();
  const { data, error: dbErr, count } = await supabase
    .from('words')
    .select('id, word, pronunciation, definition, example, example_translation, pos, difficulty, sort_order', { count: 'exact' })
    .eq('list_id', listId)
    .order('sort_order')
    .range(offset, offset + limit - 1);

  if (dbErr) return error(dbErr.message);
  return success({ words: data, total: count, page, limit });
}

export async function handleGetNewWords(event, user) {
  const listId = event.pathParameters?.id || event.queryStringParameters?.list_id;
  if (!listId) return error('List ID is required');

  const wordCount = parseInt(event.queryStringParameters?.count || '10');

  const supabase = getSupabaseAdmin();

  // Get words the user hasn't started learning yet
  const { data: learnedIds, error: learnedErr } = await supabase
    .from('user_progress')
    .select('word_id')
    .eq('user_id', user.id)
    .eq('list_id', listId);

  if (learnedErr) return error(learnedErr.message);

  const excludeIds = learnedIds?.map(p => p.word_id) || [];

  let query = supabase
    .from('words')
    .select('id, word, pronunciation, definition, example, example_translation, pos, difficulty')
    .eq('list_id', listId)
    .order('sort_order')
    .limit(wordCount);

  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`);
  }

  const { data, error: dbErr } = await query;
  if (dbErr) return error(dbErr.message);

  // Count remaining new words
  let countQuery = supabase
    .from('words')
    .select('id', { count: 'exact' })
    .eq('list_id', listId);

  if (excludeIds.length > 0) {
    countQuery = countQuery.not('id', 'in', `(${excludeIds.join(',')})`);
  }

  const { count: totalNew } = await countQuery;

  return success({ words: data, remaining_new: (totalNew || 0) - (data?.length || 0) });
}

export async function handleGetReviewWords(event, user) {
  const listId = event.pathParameters?.id || event.queryStringParameters?.list_id;
  if (!listId) return error('List ID is required');

  const supabase = getSupabaseAdmin();
  const today = new Date().toISOString().split('T')[0];

  const { data, error: dbErr } = await supabase
    .from('user_progress')
    .select('word_id, easiness_factor, repetition, interval, next_review, status, words(id, word, pronunciation, definition, example, example_translation, pos)')
    .eq('user_id', user.id)
    .eq('list_id', listId)
    .in('status', ['new', 'learning', 'reviewing'])
    .lte('next_review', today);

  if (dbErr) return error(dbErr.message);

  const reviewWords = (data || []).map(p => ({
    ...p.words,
    progress: {
      id: p.word_id,
      easiness_factor: p.easiness_factor,
      repetition: p.repetition,
      interval: p.interval,
      next_review: p.next_review,
      status: p.status
    }
  }));

  // Count remaining reviews
  const { count: totalReview } = await supabase
    .from('user_progress')
    .select('id', { count: 'exact' })
    .eq('user_id', user.id)
    .eq('list_id', listId)
    .in('status', ['new', 'learning', 'reviewing'])
    .lte('next_review', today);

  return success({ words: reviewWords, remaining_review: (totalReview || 0) - reviewWords.length });
}

export async function handleAddWord(event, user) {
  const listId = event.pathParameters?.id || event.queryStringParameters?.list_id;
  if (!listId) return error('List ID is required');

  const body = JSON.parse(event.body || '{}');
  const { word, definition, pronunciation, example, example_translation, pos } = body;

  if (!word || !definition) return error('Word and definition are required');

  const supabase = getSupabaseAdmin();
  const { data: list, error: listErr } = await supabase
    .from('word_lists')
    .select('created_by')
    .eq('id', listId)
    .single();

  if (listErr) return error(listErr.message);
  if (!list || list.created_by !== user.id) {
    return error('You can only add words to your own lists');
  }

  const { data, error: dbErr } = await supabase
    .from('words')
    .insert({
      list_id: listId,
      word,
      definition,
      pronunciation: pronunciation || '',
      example: example || '',
      example_translation: example_translation || '',
      pos: pos || ''
    })
    .select()
    .single();

  if (dbErr) return error(dbErr.message);
  return success(data);
}