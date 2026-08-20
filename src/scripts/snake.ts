import { bindTouchInput } from './lib/touch';
import { createVirtualDpad } from './lib/virtualDpad';

type Point = { x: number; y: number };
type Direction = Point;
type GameState = 'ready' | 'playing' | 'paused' | 'gameover';

const GRID_COLS = 24;
const GRID_ROWS = 18;
const TICK_MS = 110;
const HIGH_SCORE_KEY = 'backloggames-snake-high-score';

const COLORS = {
  background: '#0f1419',
  grid: '#19212b',
  snake: '#7ee787',
  snakeHead: '#5fd16b',
  food: '#e85d5d',
  text: '#f4f1ea',
  textMuted: '#9aa6b3',
};

export function initSnake(root: HTMLElement): () => void {
  root.innerHTML = '';
  root.className = 'flex min-h-[420px] flex-col items-center justify-center gap-4 p-4';

  const hud = document.createElement('div');
  hud.className =
    'flex w-full max-w-[576px] items-center justify-between text-sm text-games-ink-muted';

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
  canvas.className =
    'w-full max-w-[576px] touch-none rounded-lg border border-games-border';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Snake game board');

  const controlsMount = document.createElement('div');
  controlsMount.className = 'w-full max-w-[576px]';

  const help = document.createElement('p');
  help.className = 'text-center text-xs text-games-ink-muted';
  help.textContent =
    'Arrow keys, WASD, swipe, or D-pad to move. Tap or Space to start. P to pause.';

  root.append(hud, canvas, controlsMount, help);

  const context = canvas.getContext('2d');
  if (!context) return () => undefined;
  const ctx: CanvasRenderingContext2D = context;

  let cellSize = 24;
  let snake: Point[] = [];
  let direction: Direction = { x: 1, y: 0 };
  let pendingDirection: Direction | null = null;
  let food: Point = { x: 0, y: 0 };
  let score = 0;
  let highScore = savedHigh;
  let state: GameState = 'ready';
  let tickTimer: ReturnType<typeof setInterval> | null = null;

  function resizeCanvas() {
    const width = Math.min(root.clientWidth - 32, GRID_COLS * 24);
    cellSize = Math.floor(width / GRID_COLS);
    const height = cellSize * GRID_ROWS;
    canvas.width = cellSize * GRID_COLS;
    canvas.height = height;
    canvas.style.height = `${height}px`;
    draw();
  }

  function resetGame() {
    const startX = Math.floor(GRID_COLS / 2);
    const startY = Math.floor(GRID_ROWS / 2);
    snake = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
    ];
    direction = { x: 1, y: 0 };
    pendingDirection = null;
    score = 0;
    scoreEl.textContent = 'Score: 0';
    placeFood();
  }

  function placeFood() {
    const occupied = new Set(snake.map((segment) => `${segment.x},${segment.y}`));
    let spot: Point;
    do {
      spot = {
        x: Math.floor(Math.random() * GRID_COLS),
        y: Math.floor(Math.random() * GRID_ROWS),
      };
    } while (occupied.has(`${spot.x},${spot.y}`));
    food = spot;
  }

  function setState(next: GameState) {
    state = next;
    if (state === 'ready') {
      statusEl.textContent = 'Tap or Space to start';
      stopTick();
    } else if (state === 'playing') {
      statusEl.textContent = 'Playing';
      startTick();
    } else if (state === 'paused') {
      statusEl.textContent = 'Paused';
      stopTick();
    } else {
      statusEl.textContent = 'Game over — tap or Space to retry';
      stopTick();
    }
    draw();
  }

  function startTick() {
    stopTick();
    tickTimer = setInterval(tick, TICK_MS);
  }

  function stopTick() {
    if (tickTimer) {
      clearInterval(tickTimer);
      tickTimer = null;
    }
  }

  function tick() {
    if (state !== 'playing') return;

    if (pendingDirection) {
      direction = pendingDirection;
      pendingDirection = null;
    }

    const head = snake[0];
    const nextHead = { x: head.x + direction.x, y: head.y + direction.y };

    const hitWall =
      nextHead.x < 0 ||
      nextHead.x >= GRID_COLS ||
      nextHead.y < 0 ||
      nextHead.y >= GRID_ROWS;
    const hitSelf = snake.some(
      (segment) => segment.x === nextHead.x && segment.y === nextHead.y,
    );

    if (hitWall || hitSelf) {
      setState('gameover');
      return;
    }

    snake.unshift(nextHead);

    if (nextHead.x === food.x && nextHead.y === food.y) {
      score += 10;
      scoreEl.textContent = `Score: ${score}`;
      if (score > highScore) {
        highScore = score;
        highScoreEl.textContent = `Best: ${highScore}`;
        localStorage.setItem(HIGH_SCORE_KEY, String(highScore));
      }
      placeFood();
    } else {
      snake.pop();
    }

    draw();
  }

  function draw() {
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (let x = 0; x <= GRID_COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize, 0);
      ctx.lineTo(x * cellSize, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= GRID_ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize);
      ctx.lineTo(canvas.width, y * cellSize);
      ctx.stroke();
    }

    snake.forEach((segment, index) => {
      const padding = 2;
      ctx.fillStyle = index === 0 ? COLORS.snakeHead : COLORS.snake;
      ctx.fillRect(
        segment.x * cellSize + padding,
        segment.y * cellSize + padding,
        cellSize - padding * 2,
        cellSize - padding * 2,
      );
    });

    const foodPadding = 4;
    ctx.fillStyle = COLORS.food;
    ctx.beginPath();
    ctx.arc(
      food.x * cellSize + cellSize / 2,
      food.y * cellSize + cellSize / 2,
      cellSize / 2 - foodPadding,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    if (state !== 'playing') {
      ctx.fillStyle = 'rgba(15, 20, 25, 0.72)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = COLORS.text;
      ctx.font = 'bold 18px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const message =
        state === 'ready'
          ? 'Tap or Space to play'
          : state === 'paused'
            ? 'Paused'
            : 'Game Over';

      ctx.fillText(message, canvas.width / 2, canvas.height / 2 - 12);
      ctx.fillStyle = COLORS.textMuted;
      ctx.font = '13px Inter, sans-serif';
      ctx.fillText(
        state === 'gameover' ? `Score: ${score}` : 'Swipe, D-pad, or arrow keys',
        canvas.width / 2,
        canvas.height / 2 + 16,
      );
    }
  }

  function queueDirection(next: Direction) {
    const current = pendingDirection ?? direction;
    if (current.x + next.x === 0 && current.y + next.y === 0) return;
    pendingDirection = next;
  }

  function onKeyDown(event: KeyboardEvent) {
    const key = event.key.toLowerCase();

    if (key === ' ' || key === 'enter') {
      event.preventDefault();
      if (state === 'ready' || state === 'gameover') {
        resetGame();
        setState('playing');
      } else if (state === 'paused') {
        setState('playing');
      }
      return;
    }

    if (key === 'p' && (state === 'playing' || state === 'paused')) {
      event.preventDefault();
      setState(state === 'playing' ? 'paused' : 'playing');
      return;
    }

    if (state !== 'playing' && state !== 'paused') return;

    if (key === 'arrowup' || key === 'w') queueDirection({ x: 0, y: -1 });
    else if (key === 'arrowdown' || key === 's') queueDirection({ x: 0, y: 1 });
    else if (key === 'arrowleft' || key === 'a') queueDirection({ x: -1, y: 0 });
    else if (key === 'arrowright' || key === 'd') queueDirection({ x: 1, y: 0 });
  }

  function onTap() {
    if (state === 'ready' || state === 'gameover') {
      resetGame();
      setState('playing');
    } else if (state === 'paused') {
      setState('playing');
    }
  }

  const unbindTouch = bindTouchInput(canvas, {
    onSwipe(direction) {
      if (state !== 'playing' && state !== 'paused') return;
      if (direction === 'up') queueDirection({ x: 0, y: -1 });
      else if (direction === 'down') queueDirection({ x: 0, y: 1 });
      else if (direction === 'left') queueDirection({ x: -1, y: 0 });
      else queueDirection({ x: 1, y: 0 });
    },
    onTap,
  });

  const destroyDpad = createVirtualDpad(controlsMount, {
    dpadMode: 'press',
    onDpad(direction) {
      if (state !== 'playing' && state !== 'paused') return;
      if (direction === 'up') queueDirection({ x: 0, y: -1 });
      else if (direction === 'down') queueDirection({ x: 0, y: 1 });
      else if (direction === 'left') queueDirection({ x: -1, y: 0 });
      else queueDirection({ x: 1, y: 0 });
    },
  });

  const resizeObserver = new ResizeObserver(resizeCanvas);
  resizeObserver.observe(root);
  window.addEventListener('keydown', onKeyDown);

  resetGame();
  setState('ready');
  resizeCanvas();

  return () => {
    stopTick();
    resizeObserver.disconnect();
    window.removeEventListener('keydown', onKeyDown);
    unbindTouch();
    destroyDpad();
    root.innerHTML = '';
  };
}
