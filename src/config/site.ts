import { getFeaturedSlugForDate } from './featured';

export type GameCategory = 'arcade' | 'puzzle' | 'action' | 'casual';
export type GameStatus = 'coming-soon' | 'playable';

export type Game = {
  slug: string;
  title: string;
  description: string;
  category: GameCategory;
  status: GameStatus;
  featured?: boolean;
  /** ISO date string for catalog sort (recently added). */
  addedAt?: string;
  thumbnail: string;
  tags: string[];
};

export const categories: { id: GameCategory; label: string }[] = [
  { id: 'arcade', label: 'Arcade' },
  { id: 'puzzle', label: 'Puzzle' },
  { id: 'action', label: 'Action' },
  { id: 'casual', label: 'Casual' },
];

export const siteConfig = {
  title: 'BacklogGames | Free HTML5 games',
  tagline: 'Free browser games. No downloads, no plugins, just play.',
  description:
    'A retro-inspired portal of free HTML5 games you can play instantly in the browser. Arcade classics, puzzles, and more.',
  name: 'BacklogGames',
} as const;

export const games: Game[] = [
  {
    slug: 'snake',
    title: 'Snake',
    description:
      'Guide the snake, eat the apples, and grow as long as you can without biting your own tail.',
    category: 'arcade',
    status: 'playable',
    featured: false,
    addedAt: '2026-01-15',
    thumbnail: '/thumbnails/snake.svg',
    tags: ['classic', 'keyboard', 'high-score'],
  },
  {
    slug: 'breakout',
    title: 'Breakout',
    description:
      'Bounce the ball off your paddle and smash through every brick to clear the board.',
    category: 'arcade',
    status: 'playable',
    addedAt: '2026-02-01',
    thumbnail: '/thumbnails/breakout.svg',
    tags: ['classic', 'paddle', 'high-score'],
  },
  {
    slug: 'memory',
    title: 'Memory Match',
    description:
      'Flip the cards two at a time and match every pair before the clock gets the better of you.',
    category: 'puzzle',
    status: 'playable',
    addedAt: '2026-03-01',
    thumbnail: '/thumbnails/memory.svg',
    tags: ['cards', 'memory', 'timer'],
  },
  {
    slug: '2048',
    title: '2048',
    description:
      'Slide and merge matching tiles to reach the elusive 2048 tile, and then keep going.',
    category: 'puzzle',
    status: 'playable',
    addedAt: '2026-04-01',
    thumbnail: '/thumbnails/2048.svg',
    tags: ['numbers', 'grid', 'strategy'],
  },
  {
    slug: 'asteroids',
    title: 'Asteroids',
    description:
      'Pilot your ship through a field of drifting rocks and blast them apart before they hit you.',
    category: 'action',
    status: 'playable',
    addedAt: '2026-05-01',
    thumbnail: '/thumbnails/asteroids.svg',
    tags: ['space', 'shooter', 'physics'],
  },
  {
    slug: 'solitaire',
    title: 'Solitaire',
    description:
      'Classic Klondike solitaire. Build foundations from ace to king and clear the tableau.',
    category: 'casual',
    status: 'playable',
    featured: false,
    addedAt: '2026-08-15',
    thumbnail: '/thumbnails/solitaire.svg',
    tags: ['cards', 'classic', 'tap'],
  },
  {
    slug: 'minesweeper',
    title: 'Minesweeper',
    description:
      'Click on the squares to reveal the numbers and avoid the mines.',
    category: 'casual',
    status: 'playable',
    featured: true,
    addedAt: '2026-09-28',
    thumbnail: '/thumbnails/minesweeper.svg',
    tags: ['mines', 'click', 'grid'],
  },
  {
    slug: 'tetris',
    title: 'Tetris',
    description:
      'Fit the falling blocks into the grid to clear lines and score points.',
    category: 'casual',
    status: 'playable',
    featured: false,
    addedAt: '2026-10-01',
    thumbnail: '/thumbnails/tetris.svg',
    tags: ['tetris', 'blocks', 'grid'],
  },
];

export function getGame(slug: string): Game | undefined {
  return games.find((game) => game.slug === slug);
}

export function getFeaturedGame(referenceDate = new Date()): Game {
  const manual = games.find((game) => game.featured);
  if (manual) return manual;

  const rotatedSlug = getFeaturedSlugForDate(referenceDate);
  if (rotatedSlug) {
    const rotated = getGame(rotatedSlug);
    if (rotated) return rotated;
  }

  return games[0];
}
