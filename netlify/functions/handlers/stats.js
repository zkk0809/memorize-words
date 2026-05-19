import { getSupabaseAdmin } from '../utils/supabase-admin.js';
import { success, error } from '../utils/response.js';

export async function handleGetStats(event, user) {
  const supabase = getSupabaseAdmin();

  const { data: progress, error: dbErr } = await supabase
    .from('user_progress')
    .select('status, total_reviews, correct_count')
    .eq('user_id', user.id);

  if (dbErr) return error(dbErr.message);

  const totalLearned = progress.filter(p => p.status !== 'new').length;
  const mastered = progress.filter(p => p.status === 'mastered').length;
  const reviewing = progress.filter(p => p.status === 'reviewing').length;
  const learning = progress.filter(p => p.status === 'learning').length;
  const totalReviews = progress.reduce((sum, p) => sum + p.total_reviews, 0);
  const totalCorrect = progress.reduce((sum, p) => sum + p.correct_count, 0);
  const accuracy = totalReviews > 0 ? Math.round(totalCorrect / totalReviews * 100) : 0;

  // Calculate streak
  const { data: sessions } = await supabase
    .from('review_sessions')
    .select('started_at')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false });

  let streak = 0;
  if (sessions && sessions.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let checkDate = today;

    for (const session of sessions) {
      const sessionDate = new Date(session.started_at);
      sessionDate.setHours(0, 0, 0, 0);

      if (sessionDate.getTime() === checkDate.getTime()) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (sessionDate.getTime() < checkDate.getTime()) {
        break;
      }
    }
  }

  return success({
    total_learned: totalLearned,
    mastered,
    reviewing,
    learning,
    total_reviews: totalReviews,
    accuracy,
    streak
  });
}

export async function handleGetDailyStats(event, user) {
  const supabase = getSupabaseAdmin();
  const today = new Date().toISOString().split('T')[0];

  const { data: progress, error: dbErr } = await supabase
    .from('user_progress')
    .select('status, last_reviewed, last_grade')
    .eq('user_id', user.id);

  if (dbErr) return error(dbErr.message);

  const newToday = progress.filter(p => {
    if (!p.last_reviewed) return false;
    return p.last_reviewed.startsWith(today) && p.status !== 'new';
  }).length;

  const reviewedToday = progress.filter(p => {
    if (!p.last_reviewed) return false;
    return p.last_reviewed.startsWith(today);
  }).length;

  const correctToday = progress.filter(p => {
    if (!p.last_reviewed) return false;
    return p.last_reviewed.startsWith(today) && p.last_grade >= 3;
  }).length;

  const accuracyToday = reviewedToday > 0 ? Math.round(correctToday / reviewedToday * 100) : 0;

  // Count due reviews remaining today
  const { count: dueReviews } = await supabase
    .from('user_progress')
    .select('id', { count: 'exact' })
    .eq('user_id', user.id)
    .in('status', ['learning', 'reviewing'])
    .lte('next_review', today);

  return success({
    new_today: newToday,
    reviewed_today: reviewedToday,
    correct_today: correctToday,
    accuracy_today: accuracyToday,
    due_reviews: dueReviews || 0
  });
}