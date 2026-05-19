import { getSupabaseAdmin } from '../utils/supabase-admin.js';
import { sm2 } from '../utils/sm2.js';
import { success, error } from '../utils/response.js';

export async function handleSubmitReview(event, user) {
  const body = JSON.parse(event.body || '{}');
  const { word_id, list_id, grade, time_ms, session_id } = body;

  if (!word_id || grade === undefined) return error('word_id and grade are required');
  if (grade < 0 || grade > 5) return error('Grade must be between 0 and 5');

  const supabase = getSupabaseAdmin();

  // Get existing progress or create new
  const { data: existing, error: fetchErr } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('word_id', word_id)
    .maybeSingle();

  if (fetchErr) return error(fetchErr.message);

  let progress;
  let isNew = false;

  if (existing) {
    progress = existing;
  } else {
    isNew = true;
    const result = sm2(2.5, 0, 0, grade);
    const resolvedListId = list_id || (await getWordListId(supabase, word_id));

    if (!resolvedListId) return error('Could not determine list_id for this word');

    const { data: newProgress, error: insertErr } = await supabase
      .from('user_progress')
      .insert({
        user_id: user.id,
        word_id,
        list_id: resolvedListId,
        easiness_factor: result.easiness_factor,
        repetition: result.repetition,
        interval: result.interval,
        next_review: result.next_review,
        last_reviewed: new Date().toISOString(),
        last_grade: grade,
        status: grade >= 3 ? (result.repetition >= 5 ? 'mastered' : 'reviewing') : 'learning',
        total_reviews: 1,
        correct_count: grade >= 3 ? 1 : 0,
        wrong_count: grade < 3 ? 1 : 0
      })
      .select()
      .single();

    if (insertErr) return error(insertErr.message);
    progress = newProgress;
  }

  if (!isNew) {
    const result = sm2(
      progress.easiness_factor,
      progress.repetition,
      progress.interval,
      grade
    );

    const newStatus = grade < 3
      ? 'learning'
      : (result.repetition >= 5 ? 'mastered' : 'reviewing');

    const { data: updated, error: updateErr } = await supabase
      .from('user_progress')
      .update({
        easiness_factor: result.easiness_factor,
        repetition: result.repetition,
        interval: result.interval,
        next_review: result.next_review,
        last_reviewed: new Date().toISOString(),
        last_grade: grade,
        status: newStatus,
        total_reviews: progress.total_reviews + 1,
        correct_count: progress.correct_count + (grade >= 3 ? 1 : 0),
        wrong_count: progress.wrong_count + (grade < 3 ? 1 : 0),
        updated_at: new Date().toISOString()
      })
      .eq('id', progress.id)
      .select()
      .single();

    if (updateErr) return error(updateErr.message);
    progress = updated;
  }

  // Record the review
  if (session_id) {
    await supabase
      .from('review_records')
      .insert({
        session_id,
        user_id: user.id,
        word_id,
        grade,
        time_ms: time_ms || 0,
        answered_at: new Date().toISOString()
      });
  }

  return success({
    easiness_factor: progress.easiness_factor,
    repetition: progress.repetition,
    interval: progress.interval,
    next_review: progress.next_review,
    status: progress.status
  });
}

async function getWordListId(supabase, wordId) {
  const { data } = await supabase
    .from('words')
    .select('list_id')
    .eq('id', wordId)
    .single();
  return data?.list_id;
}

export async function handleStartSession(event, user) {
  const body = JSON.parse(event.body || '{}');
  const { list_id, session_type } = body;

  if (!session_type) return error('session_type is required');

  const supabase = getSupabaseAdmin();
  const { data, error: dbErr } = await supabase
    .from('review_sessions')
    .insert({
      user_id: user.id,
      list_id,
      session_type
    })
    .select()
    .single();

  if (dbErr) return error(dbErr.message);
  return success(data);
}

export async function handleEndSession(event, user) {
  const body = JSON.parse(event.body || '{}');
  const sessionId = event.queryStringParameters?.session_id || body.session_id;
  if (!sessionId) return error('session_id is required');

  const supabase = getSupabaseAdmin();
  const { data, error: dbErr } = await supabase
    .from('review_sessions')
    .update({
      ended_at: new Date().toISOString(),
      words_count: body.words_count || 0,
      correct_count: body.correct_count || 0
    })
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (dbErr) return error(dbErr.message);
  return success(data);
}