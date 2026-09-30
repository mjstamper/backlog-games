type GameState = 'ready' | 'playing' | 'won' | 'lost';

type Cell = {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacent: number;
};

const ROWS = 10;
const COLS = 10;
const MINE_COUNT = 10;
const LONG_PRESS_MS = 450;
const BEST_TIME_KEY = 'backloggames-minesweeper-best-time';

const NUMBER_CLASS: Record<number, string> = {
  1: 'text-[#5db0d1]',
  2: 'text-[#7ee787]',
  3: 'text-[#e85d5d]',
  4: 'text-[#a98de8]',
  5: 'text-[#e8975d]',
  6: 'text-[#5de8d1]',
  7: 'text-[#f4f1ea]',
  8: 'text-[#9aa6b3]',
};

export function initMinesweeper(root: HTMLElement): () => void {
  root.innerHTML = '';
  root.className = 'flex min-h-[420px] flex-col items-center justify-center gap-4 p-4';

  const hud = document.createElement('div');
  hud.className =
    'flex w-full max-w-[360px] flex-wrap items-center justify-between gap-2 text-sm text-games-ink-muted';

  const flagsEl = document.createElement('span');
  flagsEl.textContent = `Flags: ${MINE_COUNT}`;

  const timeEl = document.createElement('span');
  timeEl.textContent = 'Time: 0:00';

  const bestEl = document.createElement('span');
  let bestTime = Number(localStorage.getItem(BEST_TIME_KEY) ?? 0);
  bestEl.textContent = bestTime > 0 ? `Best: ${formatTime(bestTime)}` : 'Best: --';

  const statusEl = document.createElement('span');
  statusEl.className = 'w-full text-center text-games-accent sm:w-auto sm:text-right';
  statusEl.textContent = 'Tap to reveal, long-press to flag';

  const newGameBtn = document.createElement('button');
  newGameBtn.type = 'button';
  newGameBtn.className =
    'rounded-lg border border-games-border px-3 py-1 text-xs font-semibold text-games-ink transition-colors hover:border-games-accent hover:text-games-accent';
  newGameBtn.textContent = 'New Game';

  hud.append(flagsEl, timeEl, bestEl, newGameBtn, statusEl);

  const boardEl = document.createElement('div');
  boardEl.className =
    'grid w-full max-w-[360px] touch-none select-none gap-0.5 rounded-lg border border-games-border bg-games-border p-0.5';
  boardEl.style.gridTemplateColumns = `repeat(${COLS}, minmax(0, 1fr))`;
  boardEl.setAttribute('role', 'grid');
  boardEl.setAttribute('aria-label', 'Minesweeper board');

  const help = document.createElement('p');
  help.className = 'text-center text-xs text-games-ink-muted';
  help.textContent =
    'Click or tap to reveal. Right-click or long-press to flag. Space for a new game.';

  root.append(hud, boardEl, help);

  let cells: Cell[][] = [];
  let state: GameState = 'ready';
  let minesSeeded = false;
  let elapsedMs = 0;
  let timerId: ReturnType<typeof setInterval> | null = null;
  let flagCount = 0;

  function formatTime(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  }

  function stopTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function startTimer() {
    stopTimer();
    const start = Date.now() - elapsedMs;
    timerId = setInterval(() => {
      elapsedMs = Date.now() - start;
      timeEl.textContent = `Time: ${formatTime(elapsedMs)}`;
    }, 250);
  }

  function updateHud() {
    flagsEl.textContent = `Flags: ${Math.max(0, MINE_COUNT - flagCount)}`;
    timeEl.textContent = `Time: ${formatTime(elapsedMs)}`;
    bestEl.textContent = bestTime > 0 ? `Best: ${formatTime(bestTime)}` : 'Best: --';
  }

  function inBounds(row: number, col: number): boolean {
    return row >= 0 && row < ROWS && col >= 0 && col < COLS;
  }

  function forNeighbors(row: number, col: number, fn: (r: number, c: number) => void) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const r = row + dr;
        const c = col + dc;
        if (inBounds(r, c)) fn(r, c);
      }
    }
  }

  function emptyGrid(): Cell[][] {
    return Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => ({
        mine: false,
        revealed: false,
        flagged: false,
        adjacent: 0,
      })),
    );
  }

  function placeMines(safeRow: number, safeCol: number) {
    const forbidden = new Set<string>();
    forbidden.add(`${safeRow},${safeCol}`);
    forNeighbors(safeRow, safeCol, (r, c) => forbidden.add(`${r},${c}`));

    let placed = 0;
    while (placed < MINE_COUNT) {
      const r = Math.floor(Math.random() * ROWS);
      const c = Math.floor(Math.random() * COLS);
      if (forbidden.has(`${r},${c}`) || cells[r][c].mine) continue;
      cells[r][c].mine = true;
      placed += 1;
    }

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (cells[r][c].mine) continue;
        let count = 0;
        forNeighbors(r, c, (nr, nc) => {
          if (cells[nr][nc].mine) count += 1;
        });
        cells[r][c].adjacent = count;
      }
    }
    minesSeeded = true;
  }

  function revealAllMines() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (cells[r][c].mine) cells[r][c].revealed = true;
      }
    }
  }

  function countHiddenSafe(): number {
    let count = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = cells[r][c];
        if (!cell.mine && !cell.revealed) count += 1;
      }
    }
    return count;
  }

  function revealCell(row: number, col: number) {
    const cell = cells[row][col];
    if (cell.revealed || cell.flagged) return;

    cell.revealed = true;

    if (cell.mine) {
      state = 'lost';
      stopTimer();
      revealAllMines();
      statusEl.textContent = 'Mine hit — Space for new game';
      renderBoard();
      return;
    }

    if (cell.adjacent === 0) {
      forNeighbors(row, col, (r, c) => {
        if (!cells[r][c].revealed && !cells[r][c].flagged) revealCell(r, c);
      });
    }

    if (countHiddenSafe() === 0) {
      state = 'won';
      stopTimer();
      if (bestTime === 0 || elapsedMs < bestTime) {
        bestTime = elapsedMs;
        localStorage.setItem(BEST_TIME_KEY, String(bestTime));
      }
      statusEl.textContent = `Cleared in ${formatTime(elapsedMs)}! Space for new game`;
      updateHud();
    }

    renderBoard();
  }

  function toggleFlag(row: number, col: number) {
    if (state === 'won' || state === 'lost') return;
    const cell = cells[row][col];
    if (cell.revealed) return;

    if (cell.flagged) {
      cell.flagged = false;
      flagCount -= 1;
    } else if (flagCount < MINE_COUNT) {
      cell.flagged = true;
      flagCount += 1;
    }
    updateHud();
    renderBoard();
  }

  function onReveal(row: number, col: number) {
    if (state === 'won' || state === 'lost') return;
    const cell = cells[row][col];
    if (cell.flagged || cell.revealed) return;

    if (!minesSeeded) {
      if (state === 'ready') {
        state = 'playing';
        statusEl.textContent = 'Clear every safe square';
        startTimer();
      }
      placeMines(row, col);
    }

    revealCell(row, col);
  }

  function bindCellButton(btn: HTMLButtonElement, row: number, col: number) {
    let pressTimer: ReturnType<typeof setTimeout> | null = null;
    let longPressFired = false;

    function clearPressTimer() {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    }

    btn.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      longPressFired = false;
      clearPressTimer();
      pressTimer = setTimeout(() => {
        longPressFired = true;
        toggleFlag(row, col);
      }, LONG_PRESS_MS);
    });

    btn.addEventListener('pointerup', (event) => {
      if (event.button !== 0) return;
      clearPressTimer();
      if (!longPressFired) onReveal(row, col);
    });

    btn.addEventListener('pointercancel', () => {
      clearPressTimer();
    });

    btn.addEventListener('pointerleave', () => {
      clearPressTimer();
    });

    btn.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      toggleFlag(row, col);
    });
  }

  function cellLabel(cell: Cell): string {
    if (cell.flagged) return 'Flagged';
    if (!cell.revealed) return 'Hidden';
    if (cell.mine) return 'Mine';
    if (cell.adjacent === 0) return 'Empty';
    return `${cell.adjacent} adjacent mines`;
  }

  function renderBoard() {
    boardEl.innerHTML = '';
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const cell = cells[row][col];
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className =
          'flex aspect-square w-full items-center justify-center rounded-sm border text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-games-accent';
        btn.setAttribute('role', 'gridcell');
        btn.setAttribute('aria-label', cellLabel(cell));

        if (cell.revealed) {
          btn.disabled = true;
          if (cell.mine) {
            btn.classList.add('border-[#e85d5d]', 'bg-[#3d2020]', 'text-[#e85d5d]');
            btn.textContent = '*';
          } else if (cell.adjacent === 0) {
            btn.classList.add('border-games-border/50', 'bg-games-surface-hover');
          } else {
            btn.classList.add('border-games-border/50', 'bg-games-surface-hover');
            btn.textContent = String(cell.adjacent);
            const colorClass = NUMBER_CLASS[cell.adjacent];
            if (colorClass) btn.classList.add(...colorClass.split(' '));
          }
        } else {
          btn.classList.add(
            'border-games-border',
            'bg-games-surface',
            'hover:border-games-accent',
            'active:bg-games-surface-hover',
          );
          if (cell.flagged) {
            btn.textContent = 'F';
            btn.classList.add('text-games-accent');
          }
          bindCellButton(btn, row, col);
        }

        boardEl.append(btn);
      }
    }
  }

  function resetGame() {
    stopTimer();
    cells = emptyGrid();
    state = 'ready';
    minesSeeded = false;
    elapsedMs = 0;
    flagCount = 0;
    statusEl.textContent = 'Tap to reveal, long-press to flag';
    updateHud();
    renderBoard();
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    resetGame();
  }

  newGameBtn.addEventListener('click', resetGame);
  window.addEventListener('keydown', onKeyDown);
  resetGame();

  return () => {
    stopTimer();
    window.removeEventListener('keydown', onKeyDown);
    root.innerHTML = '';
  };
}
