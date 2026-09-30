import { createVirtualGameControls } from './lib/virtualDpad';

type GameState = 'ready' | 'playing' | 'paused' | 'gameover';
type PieceKind = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

type ActivePiece = {
  kind: PieceKind;
  rotation: number;
  x: number;
  y: number;
};

const COLS = 10;
const ROWS = 20;
const HIDDEN_ROWS = 2;
const PREVIEW_COLS = 4;
const PREVIEW_ROWS = 4;
const HIGH_SCORE_KEY = 'backloggames-tetris-high-score';

const COLORS = {
  background: '#0f1419',
  grid: '#19212b',
  border: '#2b3543',
  ghost: 'rgba(154, 166, 179, 0.25)',
  text: '#f4f1ea',
  textMuted: '#9aa6b3',
};

const PIECE_COLOR: Record<PieceKind, string> = {
  I: '#5de8d1',
  O: '#e8c15d',
  T: '#a98de8',
  S: '#7ee787',
  Z: '#e85d5d',
  J: '#5db0d1',
  L: '#e8975d',
};

/** Cell offsets [x, y] for each rotation (0-3). */
const SHAPES: Record<PieceKind, [number, number][][]> = {
  I: [
    [
      [0, 1],
      [1, 1],
      [2, 1],
      [3, 1],
    ],
    [
      [2, 0],
      [2, 1],
      [2, 2],
      [2, 3],
    ],
    [
      [0, 2],
      [1, 2],
      [2, 2],
      [3, 2],
    ],
    [
      [1, 0],
      [1, 1],
      [1, 2],
      [1, 3],
    ],
  ],
  O: [
    [
      [1, 0],
      [2, 0],
      [1, 1],
      [2, 1],
    ],
    [
      [1, 0],
      [2, 0],
      [1, 1],
      [2, 1],
    ],
    [
      [1, 0],
      [2, 0],
      [1, 1],
      [2, 1],
    ],
    [
      [1, 0],
      [2, 0],
      [1, 1],
      [2, 1],
    ],
  ],
  T: [
    [
      [1, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    [
      [1, 0],
      [1, 1],
      [2, 1],
      [1, 2],
    ],
    [
      [0, 1],
      [1, 1],
      [2, 1],
      [1, 2],
    ],
    [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, 2],
    ],
  ],
  S: [
    [
      [1, 0],
      [2, 0],
      [0, 1],
      [1, 1],
    ],
    [
      [1, 0],
      [1, 1],
      [2, 1],
      [2, 2],
    ],
    [
      [1, 1],
      [2, 1],
      [0, 2],
      [1, 2],
    ],
    [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 2],
    ],
  ],
  Z: [
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 1],
    ],
    [
      [2, 0],
      [1, 1],
      [2, 1],
      [1, 2],
    ],
    [
      [0, 1],
      [1, 1],
      [1, 2],
      [2, 2],
    ],
    [
      [1, 0],
      [0, 1],
      [1, 1],
      [0, 2],
    ],
  ],
  J: [
    [
      [0, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    [
      [1, 0],
      [2, 0],
      [1, 1],
      [1, 2],
    ],
    [
      [0, 1],
      [1, 1],
      [2, 1],
      [2, 2],
    ],
    [
      [1, 0],
      [1, 1],
      [0, 2],
      [1, 2],
    ],
  ],
  L: [
    [
      [2, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    [
      [1, 0],
      [1, 1],
      [1, 2],
      [2, 2],
    ],
    [
      [0, 1],
      [1, 1],
      [2, 1],
      [0, 2],
    ],
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [1, 2],
    ],
  ],
};

const PIECE_KINDS: PieceKind[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

const LINE_SCORE = [0, 100, 300, 500, 800];

function dropIntervalMs(level: number): number {
  return Math.max(100, 800 - (level - 1) * 60);
}

function cellsFor(piece: ActivePiece): [number, number][] {
  return SHAPES[piece.kind][piece.rotation % 4];
}

function previewOrigin(kind: PieceKind): { ox: number; oy: number } {
  const cells = SHAPES[kind][0];
  const xs = cells.map(([x]) => x);
  const ys = cells.map(([, y]) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  return {
    ox: Math.floor((PREVIEW_COLS - w) / 2) - minX,
    oy: Math.floor((PREVIEW_ROWS - h) / 2) - minY,
  };
}

export function initTetris(root: HTMLElement): () => void {
  root.innerHTML = '';
  root.className = 'flex min-h-[420px] flex-col items-center justify-center gap-4 p-4';

  const hud = document.createElement('div');
  hud.className =
    'flex w-full max-w-[400px] flex-wrap items-center justify-between gap-2 text-sm text-games-ink-muted';

  const scoreEl = document.createElement('span');
  scoreEl.textContent = 'Score: 0';

  const levelEl = document.createElement('span');
  levelEl.textContent = 'Level: 1';

  const linesEl = document.createElement('span');
  linesEl.textContent = 'Lines: 0';

  const highScoreEl = document.createElement('span');
  let highScore = Number(localStorage.getItem(HIGH_SCORE_KEY) ?? 0);
  highScoreEl.textContent = highScore > 0 ? `Best: ${highScore}` : 'Best: --';

  const statusEl = document.createElement('span');
  statusEl.className = 'w-full text-center text-games-accent sm:w-auto sm:text-right';
  statusEl.textContent = 'Space to start';

  hud.append(scoreEl, levelEl, linesEl, highScoreEl, statusEl);

  const playRow = document.createElement('div');
  playRow.className =
    'flex w-full max-w-[480px] flex-wrap items-start justify-center gap-3';

  const canvas = document.createElement('canvas');
  canvas.className = 'max-w-full shrink-0 touch-none rounded-lg border border-games-border';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Tetris playfield');

  const nextPanel = document.createElement('div');
  nextPanel.className = 'flex shrink-0 flex-col items-center gap-1';

  const nextLabel = document.createElement('span');
  nextLabel.className = 'text-xs font-semibold text-games-ink-muted';
  nextLabel.textContent = 'Next';

  const nextCanvas = document.createElement('canvas');
  nextCanvas.className = 'max-w-full shrink-0 touch-none rounded-lg border border-games-border';
  nextCanvas.setAttribute('role', 'img');
  nextCanvas.setAttribute('aria-label', 'Next Tetris piece');

  nextPanel.append(nextLabel, nextCanvas);
  playRow.append(canvas, nextPanel);

  const controlsMount = document.createElement('div');
  controlsMount.className = 'w-full max-w-[480px]';

  const help = document.createElement('p');
  help.className = 'text-center text-xs text-games-ink-muted';
  help.textContent =
    'Arrows to move, Up/X to rotate, Space to hard drop. P to pause. D-pad + buttons on mobile.';

  root.append(hud, playRow, controlsMount, help);

  const context = canvas.getContext('2d');
  const nextContext = nextCanvas.getContext('2d');
  if (!context || !nextContext) return () => undefined;
  const ctx: CanvasRenderingContext2D = context;
  const nextCtx: CanvasRenderingContext2D = nextContext;

  let cellSize = 20;
  let previewCellSize = 16;
  let board: (PieceKind | null)[][] = [];
  let piece: ActivePiece | null = null;
  let nextKind: PieceKind = 'T';
  let bag: PieceKind[] = [];
  let score = 0;
  let lines = 0;
  let level = 1;
  let state: GameState = 'ready';
  let rafId: number | null = null;
  let lastDropAt = 0;
  let softDropHeld = false;

  function refillBag() {
    bag = [...PIECE_KINDS];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
  }

  function drawFromBag(): PieceKind {
    if (bag.length === 0) refillBag();
    return bag.pop()!;
  }

  function emptyBoard(): (PieceKind | null)[][] {
    return Array.from({ length: ROWS + HIDDEN_ROWS }, () =>
      Array.from({ length: COLS }, () => null),
    );
  }

  function resizeCanvas() {
    const width = Math.min(root.clientWidth - 32, COLS * 24);
    cellSize = Math.max(8, Math.floor(width / COLS));
    previewCellSize = Math.max(10, Math.floor(cellSize * 0.85));

    canvas.width = cellSize * COLS;
    canvas.height = cellSize * ROWS;
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;

    nextCanvas.width = previewCellSize * PREVIEW_COLS;
    nextCanvas.height = previewCellSize * PREVIEW_ROWS;
    nextCanvas.style.width = `${nextCanvas.width}px`;
    nextCanvas.style.height = `${nextCanvas.height}px`;

    draw();
  }

  function inBounds(x: number, y: number): boolean {
    return x >= 0 && x < COLS && y >= 0 && y < ROWS + HIDDEN_ROWS;
  }

  function collides(p: ActivePiece, offsetX = 0, offsetY = 0, rotation = p.rotation): boolean {
    for (const [cx, cy] of SHAPES[p.kind][rotation % 4]) {
      const x = p.x + cx + offsetX;
      const y = p.y + cy + offsetY;
      if (x < 0 || x >= COLS || y < 0 || y >= ROWS + HIDDEN_ROWS) return true;
      if (board[y][x]) return true;
    }
    return false;
  }

  function spawnPiece(): boolean {
    const kind = nextKind;
    nextKind = drawFromBag();
    piece = { kind, rotation: 0, x: 3, y: 0 };
    if (collides(piece)) {
      piece = null;
      return false;
    }
    return true;
  }

  function lockPiece() {
    if (!piece) return;
    for (const [cx, cy] of cellsFor(piece)) {
      const x = piece.x + cx;
      const y = piece.y + cy;
      if (y >= 0 && inBounds(x, y)) board[y][x] = piece.kind;
    }
    piece = null;
    clearLines();
    if (!spawnPiece()) {
      setState('gameover');
    }
  }

  function clearLines() {
    let cleared = 0;
    for (let row = ROWS + HIDDEN_ROWS - 1; row >= 0; row--) {
      if (board[row].every((cell) => cell !== null)) {
        board.splice(row, 1);
        board.unshift(Array.from({ length: COLS }, () => null));
        cleared += 1;
        row += 1;
      }
    }
    if (cleared === 0) return;

    lines += cleared;
    score += LINE_SCORE[cleared] * level;
    const newLevel = Math.floor(lines / 10) + 1;
    if (newLevel > level) level = newLevel;

    scoreEl.textContent = `Score: ${score}`;
    linesEl.textContent = `Lines: ${lines}`;
    levelEl.textContent = `Level: ${level}`;

    if (score > highScore) {
      highScore = score;
      localStorage.setItem(HIGH_SCORE_KEY, String(highScore));
      highScoreEl.textContent = `Best: ${highScore}`;
    }
  }

  function tryMove(dx: number, dy: number): boolean {
    if (!piece || state !== 'playing') return false;
    if (collides(piece, dx, dy)) return false;
    piece.x += dx;
    piece.y += dy;
    if (dy > 0) score += 1;
    scoreEl.textContent = `Score: ${score}`;
    return true;
  }

  function tryRotate(direction: 1 | -1): boolean {
    if (!piece || state !== 'playing') return false;
    const nextRot = (piece.rotation + direction + 4) % 4;
    const kicks: [number, number][] = [
      [0, 0],
      [-1, 0],
      [1, 0],
      [-2, 0],
      [2, 0],
      [0, -1],
    ];
    for (const [kx, ky] of kicks) {
      if (!collides(piece, kx, ky, nextRot)) {
        piece.rotation = nextRot;
        piece.x += kx;
        piece.y += ky;
        return true;
      }
    }
    return false;
  }

  function hardDrop() {
    if (!piece || state !== 'playing') return;
    let dropped = 0;
    while (!collides(piece, 0, 1)) {
      piece.y += 1;
      dropped += 1;
    }
    score += dropped * 2;
    scoreEl.textContent = `Score: ${score}`;
    lockPiece();
  }

  function ghostPiece(): ActivePiece | null {
    if (!piece) return null;
    const ghost = { ...piece };
    while (!collides(ghost, 0, 1)) ghost.y += 1;
    return ghost;
  }

  function tickGravity(now: number) {
    if (state !== 'playing' || !piece) return;
    const interval = softDropHeld ? Math.max(50, dropIntervalMs(level) / 6) : dropIntervalMs(level);
    if (now - lastDropAt < interval) return;
    lastDropAt = now;
    if (!tryMove(0, 1)) lockPiece();
  }

  function drawBlock(
    targetCtx: CanvasRenderingContext2D,
    size: number,
    gridX: number,
    gridY: number,
    kind: PieceKind,
    alpha = 1,
  ) {
    const px = gridX * size;
    const py = gridY * size;
    const pad = Math.max(1, Math.floor(size * 0.08));
    targetCtx.globalAlpha = alpha;
    targetCtx.fillStyle = PIECE_COLOR[kind];
    targetCtx.fillRect(px + pad, py + pad, size - pad * 2, size - pad * 2);
    targetCtx.strokeStyle = COLORS.border;
    targetCtx.lineWidth = 1;
    targetCtx.strokeRect(px + pad, py + pad, size - pad * 2, size - pad * 2);
    targetCtx.globalAlpha = 1;
  }

  function drawCell(x: number, y: number, kind: PieceKind, alpha = 1) {
    if (y < HIDDEN_ROWS) return;
    drawBlock(ctx, cellSize, x, y - HIDDEN_ROWS, kind, alpha);
  }

  function drawBoard() {
    for (let y = HIDDEN_ROWS; y < ROWS + HIDDEN_ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const kind = board[y][x];
        if (kind) drawCell(x, y, kind);
      }
    }
  }

  function drawActive() {
    const ghost = ghostPiece();
    if (ghost) {
      for (const [cx, cy] of cellsFor(ghost)) {
        drawCell(ghost.x + cx, ghost.y + cy, ghost.kind, 0.35);
      }
    }
    if (!piece) return;
    for (const [cx, cy] of cellsFor(piece)) {
      drawCell(piece.x + cx, piece.y + cy, piece.kind);
    }
  }

  function drawGrid() {
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize + 0.5, 0);
      ctx.lineTo(x * cellSize + 0.5, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize + 0.5);
      ctx.lineTo(canvas.width, y * cellSize + 0.5);
      ctx.stroke();
    }
  }

  function drawNextPreview() {
    nextCtx.fillStyle = COLORS.background;
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    nextCtx.strokeStyle = COLORS.grid;
    nextCtx.lineWidth = 1;
    for (let x = 0; x <= PREVIEW_COLS; x++) {
      nextCtx.beginPath();
      nextCtx.moveTo(x * previewCellSize + 0.5, 0);
      nextCtx.lineTo(x * previewCellSize + 0.5, nextCanvas.height);
      nextCtx.stroke();
    }
    for (let y = 0; y <= PREVIEW_ROWS; y++) {
      nextCtx.beginPath();
      nextCtx.moveTo(0, y * previewCellSize + 0.5);
      nextCtx.lineTo(nextCanvas.width, y * previewCellSize + 0.5);
      nextCtx.stroke();
    }

    const { ox, oy } = previewOrigin(nextKind);
    for (const [cx, cy] of SHAPES[nextKind][0]) {
      drawBlock(nextCtx, previewCellSize, ox + cx, oy + cy, nextKind);
    }
  }

  function drawOverlay() {
    if (state === 'playing') return;
    ctx.fillStyle = 'rgba(15, 20, 25, 0.72)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'center';
    ctx.font = 'bold 18px Inter, sans-serif';
    const title =
      state === 'ready'
        ? 'Press Space to play'
        : state === 'paused'
          ? 'Paused'
          : 'Game Over';
    ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 8);
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '13px Inter, sans-serif';
    const sub =
      state === 'gameover'
        ? `Score: ${score} — Space to retry`
        : state === 'paused'
          ? 'Press P to resume'
          : 'Arrow keys or D-pad';
    ctx.fillText(sub, canvas.width / 2, canvas.height / 2 + 16);
  }

  function draw() {
    drawGrid();
    drawBoard();
    drawActive();
    drawOverlay();
    drawNextPreview();
  }

  function resetGame() {
    board = emptyBoard();
    score = 0;
    lines = 0;
    level = 1;
    scoreEl.textContent = 'Score: 0';
    linesEl.textContent = 'Lines: 0';
    levelEl.textContent = 'Level: 1';
    refillBag();
    nextKind = drawFromBag();
    piece = null;
    lastDropAt = performance.now();
  }

  function setState(next: GameState) {
    state = next;
    if (state === 'ready') {
      statusEl.textContent = 'Space to start';
      resetGame();
    } else if (state === 'playing') {
      statusEl.textContent = 'Playing';
      lastDropAt = performance.now();
    } else if (state === 'paused') {
      statusEl.textContent = 'Paused';
    } else {
      statusEl.textContent = 'Game over';
    }
    draw();
  }

  function startOrResume() {
    if (state === 'ready' || state === 'gameover') {
      resetGame();
      if (!spawnPiece()) {
        setState('gameover');
        return;
      }
      setState('playing');
    } else if (state === 'paused') {
      setState('playing');
    }
  }

  function frame(now: number) {
    tickGravity(now);
    draw();
    rafId = requestAnimationFrame(frame);
  }

  function onKeyDown(event: KeyboardEvent) {
    const key = event.key.toLowerCase();

    if (key === ' ' || key === 'enter') {
      event.preventDefault();
      if (state === 'playing') hardDrop();
      else startOrResume();
      return;
    }

    if (key === 'p' && (state === 'playing' || state === 'paused')) {
      event.preventDefault();
      setState(state === 'playing' ? 'paused' : 'playing');
      return;
    }

    if (state !== 'playing') return;

    if (event.key === 'ArrowLeft' || key === 'a') {
      event.preventDefault();
      tryMove(-1, 0);
    } else if (event.key === 'ArrowRight' || key === 'd') {
      event.preventDefault();
      tryMove(1, 0);
    } else if (event.key === 'ArrowDown' || key === 's') {
      event.preventDefault();
      softDropHeld = true;
      tryMove(0, 1);
    } else if (event.key === 'ArrowUp' || key === 'w' || key === 'x') {
      event.preventDefault();
      tryRotate(1);
    } else if (key === 'z') {
      event.preventDefault();
      tryRotate(-1);
    }
  }

  function onKeyUp(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    if (event.key === 'ArrowDown' || key === 's') softDropHeld = false;
  }

  const destroyControls = createVirtualGameControls(controlsMount, {
    dpadMode: 'press',
    onDpad(direction) {
      if (state !== 'playing') return;
      if (direction === 'left') tryMove(-1, 0);
      else if (direction === 'right') tryMove(1, 0);
      else if (direction === 'down') tryMove(0, 1);
      else if (direction === 'up') tryRotate(1);
    },
    actions: [
      {
        label: 'Drop',
        ariaLabel: 'Hard drop',
        onPress: () => {
          if (state === 'playing') hardDrop();
        },
      },
      {
        label: 'Rotate',
        ariaLabel: 'Rotate piece',
        onPress: () => {
          if (state === 'playing') tryRotate(1);
        },
      },
    ],
  });

  const resizeObserver = new ResizeObserver(resizeCanvas);
  resizeObserver.observe(root);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  setState('ready');
  resizeCanvas();
  rafId = requestAnimationFrame(frame);

  return () => {
    if (rafId !== null) cancelAnimationFrame(rafId);
    resizeObserver.disconnect();
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    destroyControls();
    root.innerHTML = '';
  };
}
