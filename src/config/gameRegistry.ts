import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
import AsteroidsGame from '../components/play/AsteroidsGame.astro';
import BreakoutGame from '../components/play/BreakoutGame.astro';
import Game2048 from '../components/play/Game2048.astro';
import MemoryGame from '../components/play/MemoryGame.astro';
import SnakeGame from '../components/play/SnakeGame.astro';
import SolitaireGame from '../components/play/SolitaireGame.astro';
import MinesweeperGame from '../components/play/MinesweeperGame.astro';
import TetrisGame from '../components/play/TetrisGame.astro';

export const gameRegistry: Record<string, AstroComponentFactory> = {
    snake: SnakeGame,
    breakout: BreakoutGame,
    '2048': Game2048,
    asteroids: AsteroidsGame,
    memory: MemoryGame,
    solitaire: SolitaireGame,
    minesweeper: MinesweeperGame,
    tetris: TetrisGame,
};