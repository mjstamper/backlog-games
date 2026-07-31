export type GameCategory = 'arcade' | 'puzzle' | 'action' | 'casual';
export type GameStatus = 'coming-soon' | 'playable';

export type Game = {
  slug: string;
  title: string;
  description: string;
  category: GameCategory;
  status: GameStatus;
  featured?: boolean;
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
    featured: true,
    thumbnail: '/thumbnails/snake.svg',
    tags: ['classic', 'keyboard', 'high-score'],
  },
  {
    slug: 'breakout',
    title: 'Breakout',
    description:
      'Bounce the ball off your paddle and smash through every brick to clear the board.',
    category: 'arcade',
    status: 'coming-soon',
    thumbnail: '/thumbnails/breakout.svg',
    tags: ['classic', 'paddle', 'arcade'],
  },
  {
    slug: 'memory',
    title: 'Memory Match',
    description:
      'Flip the cards two at a time and match every pair before the clock gets the better of you.',
    category: 'puzzle',
    status: 'coming-soon',
    thumbnail: '/thumbnails/memory.svg',
    tags: ['cards', 'memory', 'timer'],
  },
  {
    slug: '2048',
    title: '2048',
    description:
      'Slide and merge matching tiles to reach the elusive 2048 tile, and then keep going.',
    category: 'puzzle',
    status: 'coming-soon',
    thumbnail: '/thumbnails/2048.svg',
    tags: ['numbers', 'grid', 'strategy'],
  },
  {
    slug: 'asteroids',
    title: 'Asteroids',
    description:
      'Pilot your ship through a field of drifting rocks and blast them apart before they hit you.',
    category: 'action',
    status: 'coming-soon',
    thumbnail: '/thumbnails/asteroids.svg',
    tags: ['space', 'shooter', 'physics'],
  },
];

export function getGame(slug: string): Game | undefined {
  return games.find((game) => game.slug === slug);
}

export function getFeaturedGame(): Game {
  return games.find((game) => game.featured) ?? games[0];
}
