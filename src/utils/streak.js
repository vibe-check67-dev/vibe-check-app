import { format, subDays } from 'date-fns';

/**
 * Calculates streak from the current user's own check-in records.
 * - Records must already be filtered to the current user.
 * - If the user has a check-in today, count consecutive days from today backwards.
 * - If no check-in today, count consecutive days from yesterday backwards.
 * - Returns 0 if there are no records.
 */
export function calculateStreak(checkins) {
  if (!checkins || checkins.length === 0) return 0;

  const dates = new Set(checkins.map(c => c.checkin_date));
  const today = format(new Date(), 'yyyy-MM-dd');
  const hasToday = dates.has(today);

  // Start from today if checked in, otherwise from yesterday
  const startOffset = hasToday ? 0 : 1;

  let streak = 0;
  for (let i = startOffset; i < 365; i++) {
    const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
    if (dates.has(d)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}