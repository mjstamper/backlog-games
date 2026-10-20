import { readStoredNumber, writeStoredNumber } from './lib/scores';
import {
  buildShareResultGrid,
  copyTextToClipboard,
  type GuessMark,
} from './lib/share';
import {
  isValidGuess,
  localDateKey,
  parseLocalDayKey,
  pickDailyAnswer,
} from './wordGuessLexicon';

const STREAK_KEY = 'backloggames-word-guess-streak';
const LAST_PLAYED_KEY = 'backloggames-word-guess-last-played';
const STATE_PREFIX = 'backloggames-word-guess-state-';

const MAX_GUESSES = 6;
const WORD_LEN = 5;

type GamePhase = 'playing' | 'won' | 'lost';

type SavedDayState = {
  guesses: string[];
  marks: GuessMark[][];
  phase: GamePhase;
};

function evaluateGuess(guess: string, answer: string): GuessMark[] {
  const result: GuessMark[] = Array.from({ length: WORD_LEN }, () => 'absent');
  const remaining: Record<string, number> = {};

  for (const char of answer) {
    remaining[char] = (remaining[char] ?? 0) + 1;
  }

  for (let i = 0; i < WORD_LEN; i++) {
    if (guess[i] === answer[i]) {
      result[i] = 'correct';
      remaining[guess[i]!]!--;
    }
  }

  for (let i = 0; i < WORD_LEN; i++) {
    if (result[i] === 'correct') continue;
    const char = guess[i]!;
    if ((remaining[char] ?? 0) > 0) {
      result[i] = 'present';
      remaining[char]!--;
    }
  }

  return result;
}

function loadDayState(dayKey: string): SavedDayState | null {
  const raw = localStorage.getItem(`${STATE_PREFIX}${dayKey}`);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SavedDayState;
    if (!Array.isArray(parsed.guesses) || !Array.isArray(parsed.marks)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveDayState(dayKey: string, state: SavedDayState): void {
  localStorage.setItem(`${STATE_PREFIX}${dayKey}`, JSON.stringify(state));
}

function updateStreak(dayKey: string, won: boolean): number {
  const lastPlayed = localStorage.getItem(LAST_PLAYED_KEY);
  let streak = readStoredNumber(STREAK_KEY, 0);

  if (lastPlayed === dayKey) {
    return streak;
  }

  if (won) {
    const yesterday = parseLocalDayKey(dayKey);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = localDateKey(yesterday);
    if (lastPlayed === yesterdayKey) {
      streak += 1;
    } else {
      streak = 1;
    }
    writeStoredNumber(STREAK_KEY, streak);
  } else {
    streak = 0;
    writeStoredNumber(STREAK_KEY, 0);
  }

  localStorage.setItem(LAST_PLAYED_KEY, dayKey);
  return streak;
}

const TILE_BASE =
  'flex h-12 w-12 items-center justify-center rounded border-2 text-lg font-bold uppercase sm:h-14 sm:w-14';
const TILE_EMPTY = `${TILE_BASE} border-games-border bg-games-surface text-games-ink`;
const TILE_FILLED = `${TILE_BASE} border-games-ink-muted bg-games-surface text-games-ink`;
const TILE_CORRECT = `${TILE_BASE} border-[#7ee787] bg-[#7ee787] text-games-canvas`;
const TILE_PRESENT = `${TILE_BASE} border-[#e8c15d] bg-[#e8c15d] text-games-canvas`;
const TILE_ABSENT = `${TILE_BASE} border-[#3d4654] bg-[#3d4654] text-games-ink`;

function tileClassForMark(mark: GuessMark | null, filled: boolean): string {
  if (mark === 'correct') return TILE_CORRECT;
  if (mark === 'present') return TILE_PRESENT;
  if (mark === 'absent') return TILE_ABSENT;
  return filled ? TILE_FILLED : TILE_EMPTY;
}

const KEY_BASE =
  'min-w-[2rem] rounded border border-games-border px-2 py-3 text-xs font-semibold uppercase sm:min-w-[2.35rem] sm:text-sm';
const KEY_DEFAULT = `${KEY_BASE} bg-games-surface text-games-ink hover:border-games-accent`;
const KEY_CORRECT = `${KEY_BASE} border-[#7ee787] bg-[#7ee787] text-games-canvas`;
const KEY_PRESENT = `${KEY_BASE} border-[#e8c15d] bg-[#e8c15d] text-games-canvas`;
const KEY_ABSENT = `${KEY_BASE} border-[#3d4654] bg-[#3d4654] text-games-ink-muted`;

function bestKeyState(current: GuessMark | undefined, next: GuessMark): GuessMark {
  const rank: Record<GuessMark, number> = { correct: 3, present: 2, absent: 1 };
  if (!current) return next;
  return rank[next] > rank[current] ? next : current;
}

export function initWordGuess(root: HTMLElement): () => void {
  root.innerHTML = '';
  root.className =
    'flex min-h-[420px] flex-col items-center gap-4 p-4 sm:p-6';

  const dayKey = localDateKey();
  const answer = pickDailyAnswer();
  const saved = loadDayState(dayKey);

  let guesses: string[] = saved?.guesses ?? [];
  let marks: GuessMark[][] = saved?.marks ?? [];
  let phase: GamePhase = saved?.phase ?? 'playing';
  let current = '';
  let streak = readStoredNumber(STREAK_KEY, 0);
  let message = '';
  const keyStates: Record<string, GuessMark> = {};

  for (let g = 0; g < guesses.length; g++) {
    const rowMarks = marks[g] ?? [];
    for (let i = 0; i < WORD_LEN; i++) {
      const letter = guesses[g]![i]!;
      keyStates[letter] = bestKeyState(keyStates[letter], rowMarks[i] ?? 'absent');
    }
  }

  const hud = document.createElement('div');
  hud.className =
    'flex w-full max-w-[420px] flex-wrap items-center justify-between gap-2 text-sm text-games-ink-muted';

  const dateEl = document.createElement('span');
  dateEl.textContent = `Daily puzzle · ${dayKey}`;

  const streakEl = document.createElement('span');
  streakEl.textContent = streak > 0 ? `Streak: ${streak}` : 'Streak: 0';

  const statusEl = document.createElement('span');
  statusEl.className = 'w-full text-center text-games-accent sm:w-auto sm:text-right';

  const board = document.createElement('div');
  board.className = 'flex flex-col gap-1.5';
  board.setAttribute('role', 'grid');
  board.setAttribute('aria-label', 'Word Guess board');

  const messageEl = document.createElement('p');
  messageEl.className = 'min-h-[1.25rem] text-center text-sm text-games-ink-muted';

  const keyboard = document.createElement('div');
  keyboard.className = 'flex w-full max-w-[420px] flex-col gap-1.5';

  const actions = document.createElement('div');
  actions.className = 'flex flex-wrap items-center justify-center gap-2';

  const shareBtn = document.createElement('button');
  shareBtn.type = 'button';
  shareBtn.className =
    'rounded-lg border border-games-border px-3 py-1.5 text-xs font-semibold text-games-ink transition-colors hover:border-games-accent hover:text-games-accent disabled:cursor-not-allowed disabled:opacity-40';
  shareBtn.textContent = 'Share result';
  shareBtn.disabled = phase === 'playing';

  root.append(hud, board, messageEl, keyboard, actions);
  hud.append(dateEl, streakEl, statusEl);
  actions.append(shareBtn);

  function persist(): void {
    saveDayState(dayKey, { guesses, marks, phase });
  }

  function setStatus(): void {
    if (phase === 'won') {
      statusEl.textContent = `Solved in ${guesses.length}/${MAX_GUESSES}`;
      shareBtn.disabled = false;
      return;
    }
    if (phase === 'lost') {
      statusEl.textContent = `Answer: ${answer.toUpperCase()}`;
      shareBtn.disabled = false;
      return;
    }
    statusEl.textContent = `${guesses.length}/${MAX_GUESSES} guesses`;
    shareBtn.disabled = true;
  }

  function renderBoard(): void {
    board.innerHTML = '';
    for (let row = 0; row < MAX_GUESSES; row++) {
      const rowEl = document.createElement('div');
      rowEl.className = 'flex justify-center gap-1.5';
      rowEl.setAttribute('role', 'row');

      const guessWord = guesses[row] ?? '';
      const rowMarks = marks[row];
      const isCurrent = row === guesses.length && phase === 'playing';

      for (let col = 0; col < WORD_LEN; col++) {
        const tile = document.createElement('div');
        tile.setAttribute('role', 'gridcell');
        const letter = guessWord[col] ?? (isCurrent ? current[col] : '') ?? '';
        const mark = rowMarks?.[col] ?? null;
        tile.className = tileClassForMark(mark, letter.length > 0);
        tile.textContent = letter.toUpperCase();
        rowEl.append(tile);
      }
      board.append(rowEl);
    }
  }

  function renderKeyboard(): void {
    keyboard.innerHTML = '';
    const rows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

    for (const rowLetters of rows) {
      const rowEl = document.createElement('div');
      rowEl.className = 'flex justify-center gap-1';

      if (rowLetters.startsWith('z')) {
        const enter = document.createElement('button');
        enter.type = 'button';
        enter.className = `${KEY_DEFAULT} px-3`;
        enter.textContent = 'Enter';
        enter.addEventListener('click', () => submitGuess());
        rowEl.append(enter);
      }

      for (const letter of rowLetters) {
        const btn = document.createElement('button');
        btn.type = 'button';
        const state = keyStates[letter];
        btn.className =
          state === 'correct'
            ? KEY_CORRECT
            : state === 'present'
              ? KEY_PRESENT
              : state === 'absent'
                ? KEY_ABSENT
                : KEY_DEFAULT;
        btn.textContent = letter.toUpperCase();
        btn.addEventListener('click', () => appendLetter(letter));
        rowEl.append(btn);
      }

      if (rowLetters.startsWith('z')) {
        const back = document.createElement('button');
        back.type = 'button';
        back.className = `${KEY_DEFAULT} px-3`;
        back.textContent = 'Back';
        back.addEventListener('click', () => removeLetter());
        rowEl.append(back);
      }

      keyboard.append(rowEl);
    }
  }

  function showMessage(text: string): void {
    message = text;
    messageEl.textContent = message;
  }

  function appendLetter(letter: string): void {
    if (phase !== 'playing') return;
    if (current.length >= WORD_LEN) return;
    current += letter;
    renderBoard();
  }

  function removeLetter(): void {
    if (phase !== 'playing') return;
    current = current.slice(0, -1);
    renderBoard();
  }

  function finishRound(won: boolean): void {
    phase = won ? 'won' : 'lost';
    streak = updateStreak(dayKey, won);
    streakEl.textContent = streak > 0 ? `Streak: ${streak}` : 'Streak: 0';
    persist();
    setStatus();
    renderBoard();
    renderKeyboard();
  }

  function submitGuess(): void {
    if (phase !== 'playing') return;
    if (current.length !== WORD_LEN) {
      showMessage('Need five letters');
      return;
    }
    if (!isValidGuess(current)) {
      showMessage('Not in word list');
      return;
    }

    const normalized = current.toLowerCase();
    const rowMarks = evaluateGuess(normalized, answer);
    guesses = [...guesses, normalized];
    marks = [...marks, rowMarks];
    current = '';

    for (let i = 0; i < WORD_LEN; i++) {
      const letter = normalized[i]!;
      keyStates[letter] = bestKeyState(keyStates[letter], rowMarks[i]!);
    }

    showMessage('');

    if (normalized === answer) {
      finishRound(true);
      return;
    }

    if (guesses.length >= MAX_GUESSES) {
      finishRound(false);
      return;
    }

    persist();
    setStatus();
    renderBoard();
    renderKeyboard();
  }

  async function shareResult(): Promise<void> {
    if (phase === 'playing') return;
    const grid = buildShareResultGrid(marks);
    const headline =
      phase === 'won'
        ? `BacklogGames Word Guess ${dayKey}\n${guesses.length}/${MAX_GUESSES}\n\n`
        : `BacklogGames Word Guess ${dayKey}\nX/${MAX_GUESSES}\n\n`;
    const ok = await copyTextToClipboard(`${headline}${grid}`);
    showMessage(ok ? 'Copied to clipboard' : 'Could not copy — try again');
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (phase !== 'playing') return;
    const key = event.key.toLowerCase();

    if (key === 'enter') {
      event.preventDefault();
      submitGuess();
      return;
    }
    if (key === 'backspace') {
      event.preventDefault();
      removeLetter();
      return;
    }
    if (key.length === 1 && key >= 'a' && key <= 'z') {
      event.preventDefault();
      appendLetter(key);
    }
  }

  shareBtn.addEventListener('click', () => {
    void shareResult();
  });

  window.addEventListener('keydown', onKeyDown);

  setStatus();
  renderBoard();
  renderKeyboard();

  return () => {
    window.removeEventListener('keydown', onKeyDown);
    root.innerHTML = '';
  };
}
