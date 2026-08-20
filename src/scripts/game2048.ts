import { bindTouchInput } from './lib/touch';

type Direction = 'up' | 'down' | 'left' | 'right';
type GameState = 'ready' | 'playing' | 'gameover';

const GRID_SIZE = 4;
const PLAY_SIZE = 400;
const HIGH_SCORE_KEY = 'backloggames-2048-high-score';

const COLORS = {
  background: '#0f1419',
  grid: '#19212b',
  cellEmpty: '#222c38',
  text: '#f4f1ea',
  textMuted: '#9aa6b3',
};

const TILE_COLORS: Record<number, { bg: string; fg: string }> = {
  2: { bg: '#2b3543', fg: '#f4f1ea' },
  4: { bg: '#3a4555', fg: '#f4f1ea' },
  8: { bg: '#e8975d', fg: '#0f1419' },
  16: { bg: '#e85d5d', fg: '#f4f1ea' },
  32: { bg: '#e85d8a', fg: '#f4f1ea' },
  64: { bg: '#e85db8', fg: '#f4f1ea' },
  128: { bg: '#a98de8', fg: '#f4f1ea' },
  256: { bg: '#7e8de8', fg: '#f4f1ea' },
  512: { bg: '#5db8e8', fg: '#0f1419' },
  1024: { bg: '#7ee787', fg: '#0f1419' },
  2048: { bg: '#5fd16b', fg: '#0f1419' },
};

function tileStyle(value: number) {
  return TILE_COLORS[value] ?? { bg: '#3d4f63', fg: '#f4f1ea' };
}

export function init2048(root: HTMLElement): () => void {
  root.innerHTML = '';
  root.className = 'flex min-h-[420px] flex-col items-center justify-center gap-4 p-4';

  const hud = document.createElement('div');
  hud.className =
    'flex w-full max-w-[400px] items-center justify-between text-sm text-games-ink-muted';

  const scoreEl = document.createElement('span');
  scoreEl.textContent = 'Score: 0';

  const highScoreEl = document.createElement('span');
  const savedHigh = Number(localStorage.getItem(HIGH_SCORE_KEY) ?? 0);
  highScoreEl.textContent = `Best: ${savedHigh}`;

  const statusEl = document.createElement('span');
  statusEl.className = 'text-games-accent';
  statusEl.textContent = 'Tap or Space to start';

  hud.append(scoreEl, highScoreEl, statusEl);

  const canvas = document.createElement('canvas');
  canvas.className = 'w-full max-w-[400px] touch-none rounded-lg border border-games-border';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', '2048 game board');

  const help = document.createElement('p');
  help.className = 'text-center text-xs text-games-ink-muted';
  help.textContent =
    'Arrow keys, WASD, or swipe to slide. Tap or Space to start or restart.';

  root.append(hud, canvas, help);

  const ctx = canvas.getContext('2d');
  if (!ctx) return () => undefined;

  let grid: number[][] = [];
  let score = 0;
  let highScore = savedHigh;
  let state: GameState = 'ready';

  function emptyGrid(): number[][] {
    return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
  }

  function resizeCanvas() {
    const width = Math.min(root.clientWidth - 32, PLAY_SIZE);
    canvas.width = width;
    canvas.height = width;
    canvas.style.height = `${width}px`;
    draw();
  }

  function randomEmptyCell(): [number, number] | null {
    const empty: [number, number][] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (grid[r][c] === 0) empty.push([r, c]);
      }
    }
    if (empty.length === 0) return null;
    return empty[Math.floor(Math.random() * empty.length)];
  }

  function spawnTile() {
    const spot = randomEmptyCell();
    if (!spot) return;
    const [r, c] = spot;
    grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  }

  function resetGame() {
    grid = emptyGrid();
    score = 0;
    scoreEl.textContent = 'Score: 0';
    spawnTile();
    spawnTile();
  }

  function updateScore(points: number) {
    score += points;
    scoreEl.textContent = `Score: ${score}`;
    if (score > highScore) {
      highScore = score;
      highScoreEl.textContent = `Best: ${highScore}`;
      localStorage.setItem(HIGH_SCORE_KEY, String(highScore));
    }
  }

  function slideLine(line: number[]): { line: number[]; gained: number; moved: boolean } {
    const filtered = line.filter((v) => v !== 0);
    let gained = 0;
    const merged: number[] = [];

    for (let i = 0; i < filtered.length; i++) {
      if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
        const value = filtered[i] * 2;
        merged.push(value);
        gained += value;
        i += 1;
      } else {
        merged.push(filtered[i]);
      }
    }

    while (merged.length < GRID_SIZE) merged.push(0);

    const moved = line.some((v, i) => v !== merged[i]);
    return { line: merged, gained, moved };
  }

  function move(direction: Direction): boolean {
    let moved = false;
    let gained = 0;
    const next = emptyGrid();

    if (direction === 'left') {
      for (let r = 0; r < GRID_SIZE; r++) {
        const result = slideLine(grid[r]);
        next[r] = result.line;
        if (result.moved) moved = true;
        gained += result.gained;
      }
    } else if (direction === 'right') {
      for (let r = 0; r < GRID_SIZE; r++) {
        const result = slideLine([...grid[r]].reverse());
        next[r] = result.line.reverse();
        if (result.moved) moved = true;
        gained += result.gained;
      }
    } else if (direction === 'up') {
      for (let c = 0; c < GRID_SIZE; c++) {
        const column = grid.map((row) => row[c]);
        const result = slideLine(column);
        for (let r = 0; r < GRID_SIZE; r++) next[r][c] = result.line[r];
        if (result.moved) moved = true;
        gained += result.gained;
      }
    } else {
      for (let c = 0; c < GRID_SIZE; c++) {
        const column = grid.map((row) => row[c]).reverse();
        const result = slideLine(column);
        const restored = result.line.reverse();
        for (let r = 0; r < GRID_SIZE; r++) next[r][c] = restored[r];
        if (result.moved) moved = true;
        gained += result.gained;
      }
    }

    if (!moved) return false;

    grid = next;
    updateScore(gained);
    spawnTile();
    return true;
  }

  function canMove(): boolean {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const value = grid[r][c];
        if (value === 0) return true;
        if (c + 1 < GRID_SIZE && grid[r][c + 1] === value) return true;
        if (r + 1 < GRID_SIZE && grid[r + 1][c] === value) return true;
      }
    }
    return false;
  }

  function setState(next: GameState) {
    state = next;
    if (state === 'ready') statusEl.textContent = 'Tap or Space to start';
    else if (state === 'playing') statusEl.textContent = 'Playing';
    else statusEl.textContent = 'Game over — tap or Space to retry';
    draw();
  }

  function tryMove(direction: Direction) {
    if (state !== 'playing') return;
    move(direction);
    if (!canMove()) setState('gameover');
    else draw();
  }

  function drawRoundedRect(x: number, y: number, w: number, h: number, r: number) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
    ctx.fill();
  }

  function draw() {
    const size = canvas.width;
    const gap = size * 0.025;
    const cellSize = (size - gap * (GRID_SIZE + 1)) / GRID_SIZE;

    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = COLORS.grid;
    drawRoundedRect(0, 0, size, size, gap * 2);

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const x = gap + c * (cellSize + gap);
        const y = gap + r * (cellSize + gap);
        const value = grid[r][c];

        if (value === 0) {
          ctx.fillStyle = COLORS.cellEmpty;
        } else {
          ctx.fillStyle = tileStyle(value).bg;
        }

        drawRoundedRect(x, y, cellSize, cellSize, gap);

        if (value > 0) {
          const { fg } = tileStyle(value);
          ctx.fillStyle = fg;
          ctx.font = `${value >= 1024 ? cellSize * 0.28 : cellSize * 0.38}px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(value), x + cellSize / 2, y + cellSize / 2);
        }
      }
    }

    if (state !== 'playing') {
      ctx.fillStyle = 'rgba(15, 20, 25, 0.72)';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = COLORS.text;
      ctx.font = 'bold 20px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const message = state === 'ready' ? 'Tap or Space to play' : 'Game Over';
      ctx.fillText(message, size / 2, size / 2 - 12);
      ctx.fillStyle = COLORS.textMuted;
      ctx.font = '13px Inter, sans-serif';
      ctx.fillText(
        state === 'gameover' ? `Score: ${score}` : 'Swipe or use arrow keys',
        size / 2,
        size / 2 + 16,
      );
    }
  }

  function directionFromKey(key: string): Direction | null {
    const k = key.toLowerCase();
    if (k === 'arrowup' || k === 'w') return 'up';
    if (k === 'arrowdown' || k === 's') return 'down';
    if (k === 'arrowleft' || k === 'a') return 'left';
    if (k === 'arrowright' || k === 'd') return 'right';
    return null;
  }

  function onKeyDown(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    if (key === ' ' || key === 'enter') {
      event.preventDefault();
      startOrRestart();
      return;
    }
    const direction = directionFromKey(event.key);
    if (direction) {
      event.preventDefault();
      tryMove(direction);
    }
  }

  function startOrRestart() {
    resetGame();
    setState('playing');
  }

  const unbindTouch = bindTouchInput(canvas, {
    onSwipe(direction) {
      tryMove(direction);
    },
    onTap() {
      if (state === 'ready' || state === 'gameover') startOrRestart();
    },
  });

  const resizeObserver = new ResizeObserver(resizeCanvas);
  resizeObserver.observe(root);
  window.addEventListener('keydown', onKeyDown);

  resetGame();
  setState('ready');
  resizeCanvas();

  return () => {
    resizeObserver.disconnect();
    window.removeEventListener('keydown', onKeyDown);
    unbindTouch();
    root.innerHTML = '';
  };
}
