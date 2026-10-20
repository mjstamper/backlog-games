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
  /** Shown in the How to play panel on the game page. */
  instructions?: string[];
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
    addedAt: '2026-01-15',
    thumbnail: '/thumbnails/snake.svg',
    tags: ['classic', 'keyboard', 'high-score'],
    instructions: [
      'Eat apples to grow; avoid hitting your tail or the walls.',
      'Arrow keys, WASD, swipe, or the on-screen D-pad to turn.',
      'Space to start; P to pause.',
    ],
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
    instructions: [
      'Swipe or use arrow keys / WASD to slide all tiles in one direction.',
      'When two tiles with the same number touch, they merge into one.',
      'Reach 2048 if you can; keep playing for a higher score. The game ends when no moves remain.',
      'Tap the board, press Space, or use Restart on mobile to start or try again.',
    ],
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
    addedAt: '2026-10-01',
    thumbnail: '/thumbnails/tetris.svg',
    tags: ['tetris', 'blocks', 'grid'],
    instructions: [
      'Stack falling blocks to fill horizontal lines.',
      'Arrow keys move and rotate; Space hard-drops.',
      'Clear lines to score and level up; game ends if the stack reaches the top.',
    ],
  },
  {
    slug: 'word-guess',
    title: 'Word Guess',
    description:
      'Guess the five-letter word in six tries. Green means correct letter and spot.',
    category: 'casual',
    status: 'playable',
    addedAt: '2026-11-01',
    thumbnail: '/thumbnails/word-guess.svg',
    tags: ['word', 'daily', 'puzzle'],
    instructions: [
      'Each guess must be a valid five-letter word.',
      'Tile colors show letters that are correct, present elsewhere, or absent.',
      'Share your result grid without spoilers after you win or lose.',
    ],
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
