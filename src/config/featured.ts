/**
 * Monthly featured rotation (see docs/roadmap/).
 * When no game has `featured: true` in site.ts, the homepage uses this schedule.
 * January: 2048 (same slug as December — polish landed in Dec 2026 roadmap).
 * February: breakout (prep in docs/roadmap/january-2027.md).
 */
export const featuredByMonth: Record<number, string> = {
  1: '2048',
  2: 'breakout',
  3: 'asteroids',
  4: 'memory',
  5: 'snake',
  6: 'solitaire',
  7: 'minesweeper',
  8: 'snake',
  9: 'minesweeper',
  10: 'tetris',
  11: 'word-guess',
  12: '2048',
};

export function getFeaturedSlugForDate(date = new Date()): string | undefined {
  return featuredByMonth[date.getMonth() + 1];
}
