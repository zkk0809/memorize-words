export function sm2(easinessFactor, repetition, interval, grade) {
  let ef = easinessFactor;
  let rep = repetition;
  let intv = interval;

  if (grade >= 3) {
    if (rep === 0) {
      intv = 1;
    } else if (rep === 1) {
      intv = 6;
    } else {
      intv = Math.round(intv * ef);
    }
    rep += 1;
  } else {
    rep = 0;
    intv = 1;
  }

  ef = ef + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  if (ef < 1.3) ef = 1.3;

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + intv);

  return {
    easiness_factor: ef,
    repetition: rep,
    interval: intv,
    next_review: nextReview.toISOString().split('T')[0],
    status: grade < 3 ? 'learning' : (rep >= 5 ? 'mastered' : 'reviewing')
  };
}