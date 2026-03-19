// SM-2 Spaced Repetition Algorithm
// Quality: 0-5 (0-2 = fail/hard, 3 = medium, 4-5 = easy)

export interface SM2State {
  easiness_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_at: string;
}

export function sm2(
  quality: number, // 0-5
  prev: { easiness_factor: number; interval_days: number; repetitions: number }
): SM2State {
  const q = Math.max(0, Math.min(5, quality));

  let ef = prev.easiness_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  ef = Math.max(1.3, ef);

  let interval: number;
  let reps: number;

  if (q < 3) {
    // Failed — reset
    reps = 0;
    interval = 1;
  } else {
    reps = prev.repetitions + 1;
    if (reps === 1) interval = 1;
    else if (reps === 2) interval = 6;
    else interval = Math.round(prev.interval_days * ef);
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval);

  return {
    easiness_factor: ef,
    interval_days: interval,
    repetitions: reps,
    next_review_at: nextDate.toISOString(),
  };
}

export function ratingToQuality(rating: 'easy' | 'medium' | 'hard'): number {
  switch (rating) {
    case 'easy': return 5;
    case 'medium': return 3;
    case 'hard': return 1;
  }
}
