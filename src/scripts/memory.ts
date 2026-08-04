type GameState = 'ready' | 'playing' | 'won';

const GRID_SIZE = 4;
const PAIR_COUNT = (GRID_SIZE * GRID_SIZE) / 2;
const FLIP_BACK_MS = 800;
const BEST_TIME_KEY = 'backloggames-memory-best-time';

const SYMBOLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export function initMemory(root: HTMLElement): () => void {
  root.innerHTML = '';
  root.className = 'flex min-h-[420px] flex-col items-center justify-center gap-4 p-4';

  const hud = document.createElement('div');
  hud.className =
    'flex w-full max-w-[400px] flex-wrap items-center justify-between gap-2 text-sm text-games-ink-muted';

  const movesEl = document.createElement('span');
  movesEl.textContent = 'Moves: 0';

  const timeEl = document.createElement('span');
  timeEl.textContent = 'Time: 0:00';

  const bestEl = document.createElement('span');
  const savedBest = Number(localStorage.getItem(BEST_TIME_KEY) ?? 0);
  bestEl.textContent = savedBest > 0 ? `Best: ${formatTime(savedBest)}` : 'Best: --';

  const statusEl = document.createElement('span');
  statusEl.className = 'w-full text-center text-games-accent sm:w-auto sm:text-right';
  statusEl.textContent = 'Click a card to start';

  hud.append(movesEl, timeEl, bestEl, statusEl);

  const board = document.createElement('div');
  board.className = 'grid w-full max-w-[400px] gap-2';
  board.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;
  board.setAttribute('role', 'grid');
  board.setAttribute('aria-label', 'Memory match game board');

  const help = document.createElement('p');
  help.className = 'text-center text-xs text-games-ink-muted';
  help.textContent = 'Click cards to find matching pairs. Space to restart.';

  root.append(hud, board, help);

  let cards: { id: number; symbol: string; matched: boolean }[] = [];
  let flippedIndices: number[] = [];
  let moves = 0;
  let elapsedMs = 0;
  let bestTime = savedBest;
  let state: GameState = 'ready';
  let lockBoard = false;
  let timerId: ReturnType<typeof setInterval> | null = null;
  let flipBackTimer: ReturnType<typeof setTimeout> | null = null;

  function formatTime(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  }

  function shuffle<T>(items: T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function buildDeck() {
    const pairs = SYMBOLS.slice(0, PAIR_COUNT);
    const deck = shuffle([...pairs, ...pairs]);
    cards = deck.map((symbol, id) => ({ id, symbol, matched: false }));
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
    movesEl.textContent = `Moves: ${moves}`;
    timeEl.textContent = `Time: ${formatTime(elapsedMs)}`;
    bestEl.textContent = bestTime > 0 ? `Best: ${formatTime(bestTime)}` : 'Best: --';
  }

  function renderBoard() {
    board.innerHTML = '';
    cards.forEach((card, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className =
        'group relative aspect-square w-full rounded-lg border border-games-border bg-games-surface text-lg font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-games-accent';
      btn.setAttribute('role', 'gridcell');
      btn.setAttribute('aria-label', card.matched ? `Matched ${card.symbol}` : 'Hidden card');

      const isFlipped = card.matched || flippedIndices.includes(index);

      if (isFlipped) {
        btn.classList.add('border-games-accent', 'bg-games-surface-hover', 'text-games-accent');
        btn.textContent = card.symbol;
        btn.disabled = card.matched;
      } else {
        btn.classList.add('hover:border-games-accent', 'text-transparent');
        btn.textContent = '?';
        btn.addEventListener('click', () => onCardClick(index));
      }

      board.append(btn);
    });
  }

  function resetGame() {
    if (flipBackTimer) {
      clearTimeout(flipBackTimer);
      flipBackTimer = null;
    }
    stopTimer();
    buildDeck();
    flippedIndices = [];
    moves = 0;
    elapsedMs = 0;
    lockBoard = false;
    state = 'ready';
    statusEl.textContent = 'Click a card to start';
    updateHud();
    renderBoard();
  }

  function checkWin() {
    if (!cards.every((card) => card.matched)) return;
    stopTimer();
    state = 'won';
    if (bestTime === 0 || elapsedMs < bestTime) {
      bestTime = elapsedMs;
      localStorage.setItem(BEST_TIME_KEY, String(bestTime));
    }
    statusEl.textContent = `You win in ${moves} moves! Space to replay`;
    updateHud();
  }

  function onCardClick(index: number) {
    if (lockBoard || state === 'won') return;
    if (flippedIndices.includes(index)) return;
    if (cards[index].matched) return;

    if (state === 'ready') {
      state = 'playing';
      statusEl.textContent = 'Find the pairs';
      startTimer();
    }

    flippedIndices.push(index);
    renderBoard();

    if (flippedIndices.length < 2) return;

    lockBoard = true;
    moves += 1;
    updateHud();

    const [first, second] = flippedIndices;
    if (cards[first].symbol === cards[second].symbol) {
      cards[first].matched = true;
      cards[second].matched = true;
      flippedIndices = [];
      lockBoard = false;
      renderBoard();
      checkWin();
      return;
    }

    statusEl.textContent = 'No match';
    flipBackTimer = setTimeout(() => {
      flippedIndices = [];
      lockBoard = false;
      statusEl.textContent = state === 'playing' ? 'Find the pairs' : 'Click a card to start';
      renderBoard();
    }, FLIP_BACK_MS);
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    resetGame();
  }

  window.addEventListener('keydown', onKeyDown);
  resetGame();

  return () => {
    stopTimer();
    if (flipBackTimer) clearTimeout(flipBackTimer);
    window.removeEventListener('keydown', onKeyDown);
    root.innerHTML = '';
  };
}
