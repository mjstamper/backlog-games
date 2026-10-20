import { games, type Game } from './site';

/**
 * January 2027: lightweight related-game ranking for game detail pages.
 * See docs/roadmap/january-2027.md
 */
export function getRelatedGames(currentSlug: string, limit = 4): Game[] {
  const current = games.find((game) => game.slug === currentSlug);
  if (!current) return [];

  const candidates = games.filter(
    (game) => game.slug !== currentSlug && game.status === 'playable',
  );

  const ranked = candidates
    .map((game) => {
      let score = 0;
      if (game.category === current.category) score += 2;
      for (const tag of game.tags) {
        if (current.tags.includes(tag)) score += 1;
      }
      return { game, score };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.game.title.localeCompare(b.game.title);
    });

  return ranked.slice(0, limit).map(({ game }) => game);
}
