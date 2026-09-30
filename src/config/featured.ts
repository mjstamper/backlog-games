/**
 * Monthly featured rotation (October roadmap).
 * When no game has `featured: true` in site.ts, the homepage uses this schedule.
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
  11: 'minesweeper',
  12: '2048',
};

export function getFeaturedSlugForDate(date = new Date()): string | undefined {
  return featuredByMonth[date.getMonth() + 1];
}
