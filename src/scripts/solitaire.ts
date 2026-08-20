type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

type Card = {
  id: string;
  suit: Suit;
  rank: number;
  faceUp: boolean;
};

type PileKind = 'tableau' | 'foundation' | 'stock' | 'waste';

type Selection = {
  kind: PileKind;
  index: number;
  cardIndex: number;
};

type DropTarget = {
  kind: 'tableau' | 'foundation';
  index: number;
};

type CardLocation = {
  kind: PileKind;
  pileIndex: number;
  cardIndex: number;
};

type GameSnapshot = {
  tableau: Card[][];
  foundations: Card[][];
  stock: Card[];
  waste: Card[];
  moves: number;
  won: boolean;
  drawCount: 1 | 3;
};

const WINS_KEY = 'backloggames-solitaire-wins';
const SAVE_KEY = 'backloggames-solitaire-save';
const MUTE_KEY = 'backloggames-solitaire-mute';

const DRAG_THRESHOLD = 8;
const DOUBLE_TAP_MS = 300;
const SLIDE_MS = 200;
const FLIP_MS = 280;

const RANK_LABELS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUIT_SYMBOL: Record<Suit, string> = {
  hearts: '\u2665',
  diamonds: '\u2666',
  clubs: '\u2663',
  spades: '\u2660',
};

const TABLEAU_COUNT = 7;
const FOUNDATION_COUNT = 4;

const STYLES = `
.sol-card {
  position: absolute;
  left: 50%;
  width: 2.5rem;
  height: 3.5rem;
  transform: translateX(-50%);
  perspective: 600px;
  padding: 0;
  cursor: pointer;
  transition: top ${SLIDE_MS}ms ease, left ${SLIDE_MS}ms ease, opacity 150ms ease, box-shadow 150ms ease;
  z-index: 1;
}
@media (min-width: 640px) {
  .sol-card { width: 3rem; height: 4.5rem; }
}
.sol-card.selected { z-index: 10; }
.sol-card.dragging { opacity: 0; }
.sol-card.hidden { display: none; }
.sol-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform ${FLIP_MS}ms ease;
  border-radius: 0.375rem;
}
.sol-card.face-down .sol-card-inner { transform: rotateY(180deg); }
.sol-card-face,
.sol-card-back {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  border: 1px solid #2b3543;
  backface-visibility: hidden;
  font-size: 0.75rem;
  font-weight: 700;
}
@media (min-width: 640px) {
  .sol-card-face, .sol-card-back { font-size: 0.875rem; }
}
.sol-card-face { background: #222c38; }
.sol-card-corner {
  position: absolute;
  top: 2px;
  left: 3px;
  font-size: 0.5rem;
  line-height: 1.05;
  text-align: center;
  min-width: 0.7rem;
}
@media (min-width: 640px) {
  .sol-card-corner { font-size: 0.6rem; top: 3px; left: 4px; }
}
.sol-card-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.sol-card-back {
  transform: rotateY(180deg);
  background: repeating-linear-gradient(
    45deg,
    #19212b,
    #19212b 4px,
    #1e3d3d 4px,
    #1e3d3d 8px
  );
  border-color: rgba(126, 231, 135, 0.45);
  overflow: hidden;
}
.sol-card-back::after {
  content: '';
  position: absolute;
  inset: 4px;
  border-radius: 0.25rem;
  border: 1px solid rgba(126, 231, 135, 0.25);
  background: radial-gradient(circle at 30% 30%, rgba(126,231,135,0.15), transparent 60%);
}
.sol-card-back-label {
  position: relative;
  z-index: 1;
  font-size: 0.55rem;
  letter-spacing: 0.08em;
  color: rgba(126, 231, 135, 0.7);
}
.sol-card.red .sol-card-face { color: #e85d5d; }
.sol-card.black .sol-card-face { color: #f4f1ea; }
.sol-card.selected .sol-card-face,
.sol-card.selected .sol-card-back {
  border-color: #7ee787;
  box-shadow: 0 0 0 2px rgba(126, 231, 135, 0.35);
}
.sol-slot {
  position: absolute;
  left: 50%;
  top: 0;
  width: 2.5rem;
  height: 3.5rem;
  transform: translateX(-50%);
  border-radius: 0.375rem;
  border: 1px dashed #2b3543;
  background: rgba(15, 20, 25, 0.5);
}
@media (min-width: 640px) {
  .sol-slot { width: 3rem; height: 4.5rem; }
}
.sol-stock {
  position: relative;
  z-index: 10;
  width: 2.5rem;
  height: 3.5rem;
  padding: 0;
  cursor: pointer;
  border-radius: 0.375rem;
  border: 1px dashed #2b3543;
  background: rgba(15, 20, 25, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 150ms ease, background 150ms ease, opacity 150ms ease;
}
@media (min-width: 640px) {
  .sol-stock { width: 3rem; height: 4.5rem; }
}
.sol-stock.has-cards {
  border: 1px solid rgba(126, 231, 135, 0.45);
  background: transparent;
}
.sol-stock.has-cards:hover {
  border-color: rgba(126, 231, 135, 0.65);
}
.sol-stock-back {
  position: absolute;
  inset: 0;
  border-radius: 0.375rem;
  border: 1px solid rgba(126, 231, 135, 0.4);
  background: repeating-linear-gradient(
    45deg,
    #19212b,
    #19212b 4px,
    #1e3d3d 4px,
    #1e3d3d 8px
  );
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.sol-stock-back::after {
  content: '';
  position: absolute;
  inset: 4px;
  border-radius: 0.25rem;
  border: 1px solid rgba(126, 231, 135, 0.25);
  background: radial-gradient(circle at 30% 30%, rgba(126,231,135,0.15), transparent 60%);
}
.sol-stock.can-redo {
  border: 1px dashed rgba(126, 231, 135, 0.45);
  background: rgba(15, 20, 25, 0.65);
}
.sol-stock.can-redo:hover {
  border-color: rgba(126, 231, 135, 0.7);
  background: rgba(30, 61, 61, 0.35);
}
.sol-stock-icon {
  font-size: 1.125rem;
  line-height: 1;
  color: rgba(126, 231, 135, 0.8);
  font-weight: 700;
}
@media (min-width: 640px) {
  .sol-stock-icon { font-size: 1.35rem; }
}
.sol-stock.is-empty {
  border: 1px dashed #2b3543;
  background: rgba(15, 20, 25, 0.35);
  cursor: default;
  opacity: 0.45;
}
.sol-win-overlay {
  position: absolute;
  inset: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: rgba(15, 20, 25, 0.82);
  pointer-events: auto;
}
.sol-win-overlay.hidden,
.sol-win-overlay[hidden] {
  display: none;
}
.sol-win-card {
  position: absolute;
  width: 2.5rem;
  height: 3.5rem;
  border-radius: 0.375rem;
  border: 1px solid #7ee787;
  background: #222c38;
  animation: sol-cascade 1.2s ease-in forwards;
  opacity: 0;
}
@keyframes sol-cascade {
  0% { opacity: 0; transform: translateY(-40px) rotate(-8deg); }
  30% { opacity: 1; }
  100% { opacity: 0.85; transform: translateY(80px) rotate(12deg); }
}
`;

function isRed(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds';
}

function createDeck(): Card[] {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const deck: Card[] = [];
  let id = 0;
  for (const suit of suits) {
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({ id: String(id++), suit, rank, faceUp: false });
    }
  }
  return deck;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function cloneState(): GameSnapshot {
  return structuredClone({
    tableau,
    foundations,
    stock,
    waste,
    moves,
    won,
    drawCount,
  });
}

function isValidTableauStack(cards: Card[]): boolean {
  for (let i = 0; i < cards.length - 1; i++) {
    const current = cards[i];
    const next = cards[i + 1];
    if (!current.faceUp || !next.faceUp) return false;
    if (isRed(current.suit) === isRed(next.suit)) return false;
    if (current.rank !== next.rank + 1) return false;
  }
  return cards.length > 0 && cards[cards.length - 1].faceUp;
}

function canPlaceOnTableau(card: Card, target: Card | null): boolean {
  if (!target) return card.rank === 13;
  return isRed(card.suit) !== isRed(target.suit) && card.rank === target.rank - 1;
}

function canPlaceOnFoundation(card: Card, target: Card | null): boolean {
  if (!target) return card.rank === 1;
  return card.suit === target.suit && card.rank === target.rank + 1;
}

function pointInRect(x: number, y: number, rect: DOMRect): boolean {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function getCardHeight(): number {
  return window.matchMedia('(min-width: 640px)').matches ? 72 : 56;
}

function faceDownOffset(): number {
  return window.matchMedia('(min-width: 640px)').matches ? 12 : 10;
}

function faceUpOffset(): number {
  return window.matchMedia('(min-width: 640px)').matches ? 28 : 22;
}

function offsetAfterCard(pile: Card[], cardIndex: number): number {
  return pile[cardIndex].faceUp ? faceUpOffset() : faceDownOffset();
}

function tableauCardTop(pile: Card[], cardIndex: number, scale = 1): number {
  let top = 0;
  for (let i = 0; i < cardIndex; i++) {
    top += offsetAfterCard(pile, i) * scale;
  }
  return top;
}

function tableauColumnHeight(pile: Card[], scale = 1): number {
  if (pile.length === 0) return getCardHeight();
  return tableauCardTop(pile, pile.length - 1, scale) + getCardHeight();
}

function tableauCardPeekHeight(pile: Card[], cardIndex: number, scale = 1): number {
  if (cardIndex >= pile.length - 1) return getCardHeight();
  return offsetAfterCard(pile, cardIndex) * scale;
}

function computeTableauScale(): number {
  const maxAllowed = Math.max(260, window.innerHeight * 0.55);
  let tallest = getCardHeight();
  for (const pile of tableau) {
    tallest = Math.max(tallest, tableauColumnHeight(pile, 1));
  }
  if (tallest <= maxAllowed) return 1;
  return Math.max(0.5, maxAllowed / tallest);
}

// Module-level state refs filled in initSolitaire
let tableau: Card[][] = [];
let foundations: Card[][] = [[], [], [], []];
let stock: Card[] = [];
let waste: Card[] = [];
let moves = 0;
let won = false;
let drawCount: 1 | 3 = 1;

export function initSolitaire(root: HTMLElement): () => void {
  won = false;
  moves = 0;

  root.innerHTML = '';
  root.className =
    'relative flex min-h-[420px] w-full flex-col items-center gap-3 p-2 sm:p-4';

  const styleEl = document.createElement('style');
  styleEl.textContent = STYLES;
  root.append(styleEl);

  const hud = document.createElement('div');
  hud.className =
    'flex w-full max-w-3xl flex-wrap items-center justify-between gap-2 text-sm text-games-ink-muted';

  const movesEl = document.createElement('span');
  movesEl.textContent = 'Moves: 0';

  const winsEl = document.createElement('span');
  const savedWins = Number(localStorage.getItem(WINS_KEY) ?? 0);
  winsEl.textContent = `Wins: ${savedWins}`;

  const statusEl = document.createElement('span');
  statusEl.className = 'w-full text-center text-games-accent sm:w-auto sm:text-right';
  statusEl.textContent = 'Tap or drag cards to play';

  hud.append(movesEl, winsEl, statusEl);

  const controls = document.createElement('div');
  controls.className =
    'flex w-full max-w-3xl flex-wrap items-center justify-center gap-2 text-xs';

  function makeControl(label: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.className =
      'rounded-lg border border-games-border bg-games-surface px-3 py-1.5 font-semibold text-games-ink transition-colors hover:border-games-accent hover:text-games-accent disabled:cursor-not-allowed disabled:opacity-40';
    btn.addEventListener('click', onClick);
    return btn;
  }

  const undoBtn = makeControl('Undo', () => undo());
  const drawBtn = makeControl('Draw-1', () => toggleDrawCount());
  const collectBtn = makeControl('Collect', () => startAutoCollect());
  collectBtn.style.display = 'none';
  const muteBtn = makeControl('Sound', () => toggleMute());
  const newDealBtn = makeControl('New Deal', () => requestDeal());

  controls.append(undoBtn, drawBtn, collectBtn, muteBtn, newDealBtn);

  const board = document.createElement('div');
  board.className = 'relative w-full max-w-3xl touch-manipulation select-none';

  const topRow = document.createElement('div');
  topRow.className = 'relative mb-3 grid grid-cols-7 gap-1 sm:gap-2';

  const stockZone = document.createElement('div');
  stockZone.className = 'relative col-span-1 flex justify-center';
  stockZone.style.minHeight = `${getCardHeight()}px`;
  const wasteZone = document.createElement('div');
  wasteZone.className = 'relative col-span-1 flex justify-center';
  wasteZone.style.minHeight = `${getCardHeight()}px`;
  const spacer = document.createElement('div');
  spacer.className = 'col-span-1 hidden sm:block';
  const foundationsRow = document.createElement('div');
  foundationsRow.className =
    'relative col-span-4 grid grid-cols-4 gap-1 sm:col-span-3 sm:gap-2';

  topRow.append(stockZone, wasteZone, spacer, foundationsRow);

  const tableauRow = document.createElement('div');
  tableauRow.className = 'relative grid grid-cols-7 gap-1 sm:gap-2';

  const dragLayer = document.createElement('div');
  dragLayer.className = 'pointer-events-none absolute inset-0 z-40 overflow-visible';
  dragLayer.setAttribute('aria-hidden', 'true');

  const winOverlay = document.createElement('div');
  winOverlay.className = 'sol-win-overlay hidden';
  winOverlay.hidden = true;
  winOverlay.innerHTML = `
    <p class="font-arcade text-sm text-[#f2ea4a]">You win!</p>
    <button type="button" id="sol-new-game" class="rounded-full bg-[#f2ea4a] px-6 py-2.5 text-sm font-semibold text-[#142929] transition-colors hover:bg-[#ffe566]">New Game</button>
  `;

  board.append(topRow, tableauRow, dragLayer, winOverlay);

  const help = document.createElement('p');
  help.className = 'text-center text-xs text-games-ink-muted';
  help.textContent =
    'Tap or drag to move. Double-click/tap for foundation. Ctrl+Z to undo. Space for new deal.';

  root.append(hud, controls, board, help);

  let wins = savedWins;
  let selection: Selection | null = null;
  let dealConfirmPending = false;
  let muted = localStorage.getItem(MUTE_KEY) === 'true';
  let autoCollectTimer: ReturnType<typeof setInterval> | null = null;
  const undoStack: GameSnapshot[] = [];

  const cardEls = new Map<string, HTMLButtonElement>();
  const cardFaceState = new Map<string, boolean>();
  const foundationZones: HTMLElement[] = [];
  const tableauZones: HTMLElement[] = [];
  const foundationSlots: HTMLButtonElement[] = [];
  const tableauSlots: HTMLButtonElement[] = [];
  let stockBtn: HTMLButtonElement | null = null;

  let suppressClickUntil = 0;
  let dragPointerId: number | null = null;
  let dragActive = false;
  let dragClone: HTMLElement | null = null;
  let dragOriginRect: DOMRect | null = null;
  let dragGrabOffsetX = 0;
  let dragGrabOffsetY = 0;
  let dragSourceElements: HTMLElement[] = [];
  let dragStartX = 0;
  let dragStartY = 0;
  let dragSource: Selection | null = null;

  let lastTapTime = 0;
  let lastTapX = 0;
  let lastTapY = 0;
  let tableauScale = 1;

  let audioCtx: AudioContext | null = null;

  function topCard(pile: Card[]): Card | null {
    return pile.length > 0 ? pile[pile.length - 1] : null;
  }

  function playSound(kind: 'flip' | 'invalid' | 'win') {
    if (muted) return;
    try {
      audioCtx ??= new AudioContext();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      const t = audioCtx.currentTime;
      if (kind === 'flip') {
        osc.frequency.setValueAtTime(520, t);
        osc.frequency.exponentialRampToValueAtTime(780, t + 0.06);
        gain.gain.setValueAtTime(0.06, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.start(t);
        osc.stop(t + 0.08);
      } else if (kind === 'invalid') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(180, t);
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.start(t);
        osc.stop(t + 0.12);
      } else {
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.setValueAtTime(660, t + 0.1);
        osc.frequency.setValueAtTime(880, t + 0.2);
        gain.gain.setValueAtTime(0.07, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        osc.start(t);
        osc.stop(t + 0.45);
      }
    } catch {
      /* audio unavailable */
    }
  }

  function toggleMute() {
    muted = !muted;
    localStorage.setItem(MUTE_KEY, String(muted));
    muteBtn.textContent = muted ? 'Muted' : 'Sound';
  }

  muteBtn.textContent = muted ? 'Muted' : 'Sound';

  function buildCardLocations(): Map<string, CardLocation> {
    const map = new Map<string, CardLocation>();
    stock.forEach((card, i) => map.set(card.id, { kind: 'stock', pileIndex: 0, cardIndex: i }));
    waste.forEach((card, i) => map.set(card.id, { kind: 'waste', pileIndex: 0, cardIndex: i }));
    foundations.forEach((pile, fi) =>
      pile.forEach((card, i) =>
        map.set(card.id, { kind: 'foundation', pileIndex: fi, cardIndex: i }),
      ),
    );
    tableau.forEach((pile, col) =>
      pile.forEach((card, i) =>
        map.set(card.id, { kind: 'tableau', pileIndex: col, cardIndex: i }),
      ),
    );
    return map;
  }

  function locationToSelection(loc: CardLocation): Selection {
    return { kind: loc.kind, index: loc.pileIndex, cardIndex: loc.cardIndex };
  }

  function cardFaceHtml(card: Card): string {
    const rank = RANK_LABELS[card.rank - 1];
    const suit = SUIT_SYMBOL[card.suit];
    return `
      <span class="sol-card-corner">${rank}<br>${suit}</span>
      <div class="sol-card-center">
        <span class="leading-none">${rank}</span>
        <span class="text-base leading-none sm:text-lg">${suit}</span>
      </div>
    `;
  }

  function createCardElement(card: Card): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.cardId = card.id;
    btn.className = `sol-card ${isRed(card.suit) ? 'red' : 'black'} face-down`;
    btn.innerHTML = `
      <div class="sol-card-inner">
        <div class="sol-card-face">${cardFaceHtml(card)}</div>
        <div class="sol-card-back"><span class="sol-card-back-label">BG</span></div>
      </div>
    `;
    btn.setAttribute('aria-label', 'Card');

    btn.addEventListener('pointerdown', (event) => {
      if (won || event.button !== 0) return;
      const loc = buildCardLocations().get(card.id);
      if (!loc || loc.kind === 'stock') return;
      if (loc.kind === 'tableau' && !tableau[loc.pileIndex][loc.cardIndex]?.faceUp) return;

      const source = locationToSelection(loc);
      const cards =
        source.kind === 'waste'
          ? waste.length
            ? [waste[waste.length - 1]]
            : []
          : tableau[source.index].slice(source.cardIndex);

      if (cards.length === 0) return;
      if (source.kind === 'tableau' && !isValidTableauStack(cards)) return;

      dragSource = source;
      dragPointerId = event.pointerId;
      dragStartX = event.clientX;
      dragStartY = event.clientY;
      dragActive = false;
      dragSourceElements = cards
        .map((c) => cardEls.get(c.id))
        .filter((el): el is HTMLButtonElement => !!el);

      window.addEventListener('pointermove', onDragPointerMove);
      window.addEventListener('pointerup', onDragPointerUp);
      window.addEventListener('pointercancel', onDragPointerUp);
    });

    btn.addEventListener('click', (event) => {
      if (won || Date.now() < suppressClickUntil || dragActive) return;
      const loc = buildCardLocations().get(card.id);
      if (!loc || loc.kind === 'stock') return;
      handleCardInteraction(locationToSelection(loc), event);
    });

    btn.addEventListener('dblclick', (event) => {
      event.preventDefault();
      if (won) return;
      const loc = buildCardLocations().get(card.id);
      if (!loc || loc.kind === 'stock') return;
      if (loc.kind === 'tableau' && !tableau[loc.pileIndex][loc.cardIndex]?.faceUp) return;
      suppressClickUntil = Date.now() + 200;
      tryAutoMoveToFoundation(locationToSelection(loc));
    });

    return btn;
  }

  function ensureCardElements(deck: Card[]) {
    for (const card of deck) {
      if (!cardEls.has(card.id)) {
        const el = createCardElement(card);
        cardEls.set(card.id, el);
      }
    }
  }

  function updateCardElement(card: Card, loc: CardLocation | undefined) {
    const el = cardEls.get(card.id);
    if (!el || !loc) {
      el?.classList.add('hidden');
      return;
    }

    el.classList.remove('hidden', 'dragging');

    const wasFaceUp = cardFaceState.get(card.id) ?? false;
    if (wasFaceUp !== card.faceUp) {
      cardFaceState.set(card.id, card.faceUp);
      if (card.faceUp) {
        el.classList.remove('face-down');
        el.classList.add('face-up');
        playSound('flip');
      } else {
        el.classList.remove('face-up');
        el.classList.add('face-down');
      }
    } else {
      el.classList.toggle('face-up', card.faceUp);
      el.classList.toggle('face-down', !card.faceUp);
    }

    const faceEl = el.querySelector('.sol-card-face');
    if (faceEl) faceEl.innerHTML = cardFaceHtml(card);

    const selected = isSelected(loc.kind, loc.pileIndex, loc.cardIndex);
    el.classList.toggle('selected', selected);
    el.setAttribute(
      'aria-label',
      card.faceUp ? `${RANK_LABELS[card.rank - 1]} of ${card.suit}` : 'Face-down card',
    );

    if (isDragSource(loc.kind, loc.pileIndex, loc.cardIndex)) {
      el.classList.add('dragging');
    }

    if (loc.kind === 'tableau') {
      const parent = tableauZones[loc.pileIndex];
      const pile = tableau[loc.pileIndex];
      if (el.parentElement !== parent) parent.append(el);
      el.style.top = `${tableauCardTop(pile, loc.cardIndex, tableauScale)}px`;
      el.style.left = '50%';
      el.style.zIndex = String(loc.cardIndex + 1);

      const peek = tableauCardPeekHeight(pile, loc.cardIndex, tableauScale);
      const clipBottom = Math.max(0, getCardHeight() - peek);
      el.style.clipPath =
        clipBottom > 0.5 ? `inset(0px 0px ${clipBottom}px 0px)` : 'none';
      el.style.pointerEvents = card.faceUp ? 'auto' : 'none';
    } else if (loc.kind === 'waste') {
      el.style.clipPath = 'none';
      if (el.parentElement !== wasteZone) wasteZone.append(el);
      const visibleCount = Math.min(drawCount, waste.length);
      const fromTop = waste.length - 1 - loc.cardIndex;
      if (fromTop >= visibleCount) {
        el.classList.add('hidden');
        return;
      }
      el.classList.remove('hidden');

      const fanStep = 14;
      const spread = (visibleCount - 1) * fanStep;
      // Top card (fromTop=0) is rightmost and stacked above the fan.
      el.style.top = '0';
      el.style.left = `calc(50% + ${spread / 2 - fromTop * fanStep}px)`;
      el.style.zIndex = String(visibleCount - fromTop);
      el.style.pointerEvents = fromTop === 0 ? 'auto' : 'none';
    } else if (loc.kind === 'foundation') {
      const parent = foundationZones[loc.pileIndex];
      if (el.parentElement !== parent) parent.append(el);
      const isTop = loc.cardIndex === foundations[loc.pileIndex].length - 1;
      if (!isTop) {
        el.classList.add('hidden');
        return;
      }
      el.style.top = '0';
      el.style.left = '50%';
      el.style.zIndex = '1';
    } else if (loc.kind === 'stock') {
      // Stock pile is drawn via stockBtn; keep card elements hidden so clicks reach it.
      el.classList.add('hidden');
      el.style.pointerEvents = 'none';
      return;
    }
  }

  function pushUndo() {
    undoStack.push(cloneState());
    if (undoStack.length > 50) undoStack.shift();
    undoBtn.disabled = false;
  }

  function undo() {
    const snap = undoStack.pop();
    if (!snap) return;
    stopAutoCollect();
    tableau = snap.tableau;
    foundations = snap.foundations;
    stock = snap.stock;
    waste = snap.waste;
    moves = snap.moves;
    won = snap.won;
    drawCount = snap.drawCount;
    selection = null;
    dealConfirmPending = false;
    drawBtn.textContent = drawCount === 1 ? 'Draw-1' : 'Draw-3';
    undoBtn.disabled = undoStack.length === 0;
    statusEl.textContent = 'Move undone';
    render();
  }

  function saveGame() {
    if (won) {
      localStorage.removeItem(SAVE_KEY);
      return;
    }
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({ tableau, foundations, stock, waste, moves, won, drawCount }),
    );
  }

  function loadGame(): boolean {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    try {
      const data = JSON.parse(raw) as GameSnapshot;
      const foundationTotal = data.foundations?.reduce((sum, pile) => sum + pile.length, 0) ?? 0;
      if (!data.tableau || data.won || foundationTotal === 52) {
        localStorage.removeItem(SAVE_KEY);
        return false;
      }
      tableau = data.tableau;
      foundations = data.foundations;
      stock = data.stock;
      waste = data.waste;
      moves = data.moves;
      won = false;
      drawCount = data.drawCount ?? 1;
      return true;
    } catch {
      localStorage.removeItem(SAVE_KEY);
      return false;
    }
  }

  function deal() {
    resetWinOverlay();
    cancelDrag(false);
    stopAutoCollect();
    undoStack.length = 0;
    undoBtn.disabled = true;
    dealConfirmPending = false;

    const deck = shuffle(createDeck());
    ensureCardElements(deck);

    tableau = Array.from({ length: TABLEAU_COUNT }, () => []);
    foundations = [[], [], [], []];
    stock = [];
    waste = [];
    moves = 0;
    won = false;
    selection = null;
    statusEl.textContent = 'Tap stock to draw';

    let index = 0;
    for (let col = 0; col < TABLEAU_COUNT; col++) {
      for (let row = 0; row <= col; row++) {
        const card = deck[index++];
        card.faceUp = row === col;
        cardFaceState.set(card.id, card.faceUp);
        tableau[col].push(card);
      }
    }
    stock = deck.slice(index);
    for (const c of stock) cardFaceState.set(c.id, false);

    drawBtn.textContent = drawCount === 1 ? 'Draw-1' : 'Draw-3';
    updateHud();
    render();
  }

  function requestDeal() {
    if (won) {
      deal();
      return;
    }
    if (moves === 0) {
      deal();
      return;
    }
    if (!dealConfirmPending) {
      dealConfirmPending = true;
      statusEl.textContent = 'Press again to confirm new deal';
      return;
    }
    deal();
  }

  function updateHud() {
    movesEl.textContent = `Moves: ${moves}`;
    winsEl.textContent = `Wins: ${wins}`;
  }

  function showWinOverlay() {
    winOverlay.classList.remove('hidden');
    winOverlay.hidden = false;
    winOverlay.querySelectorAll('.sol-win-card').forEach((el) => el.remove());
    for (let i = 0; i < 12; i++) {
      const c = document.createElement('div');
      c.className = 'sol-win-card';
      c.style.left = `${10 + Math.random() * 80}%`;
      c.style.top = `${15 + Math.random() * 25}%`;
      c.style.animationDelay = `${i * 0.07}s`;
      winOverlay.append(c);
    }
    playSound('win');
  }

  function resetWinOverlay() {
    winOverlay.classList.add('hidden');
    winOverlay.hidden = true;
  }

  winOverlay.addEventListener('click', (event) => {
    const target = (event.target as HTMLElement).closest('#sol-new-game');
    if (!target) return;
    resetWinOverlay();
    deal();
  });

  function checkWin() {
    const total = foundations.reduce((sum, pile) => sum + pile.length, 0);
    if (total === 52 && !won) {
      won = true;
      wins += 1;
      localStorage.setItem(WINS_KEY, String(wins));
      localStorage.removeItem(SAVE_KEY);
      statusEl.textContent = 'You win!';
      updateHud();
      showWinOverlay();
    }
  }

  function clearSelection() {
    selection = null;
  }

  function getSelectedCards(): Card[] {
    if (!selection) return [];
    if (selection.kind === 'waste') return waste.length ? [waste[waste.length - 1]] : [];
    if (selection.kind === 'foundation') {
      const pile = foundations[selection.index];
      return pile.length ? [pile[pile.length - 1]] : [];
    }
    if (selection.kind === 'tableau') {
      return tableau[selection.index].slice(selection.cardIndex);
    }
    return [];
  }

  function removeSelectedCards(): Card[] {
    if (!selection) return [];
    if (selection.kind === 'waste') return waste.splice(waste.length - 1, 1);
    if (selection.kind === 'foundation') return foundations[selection.index].splice(-1, 1);
    if (selection.kind === 'tableau') {
      const pile = tableau[selection.index];
      const removed = pile.splice(selection.cardIndex);
      const newTop = topCard(pile);
      if (newTop && !newTop.faceUp) newTop.faceUp = true;
      return removed;
    }
    return [];
  }

  function recordMove() {
    pushUndo();
    moves += 1;
    dealConfirmPending = false;
  }

  function tryMoveToTableau(col: number): boolean {
    const cards = getSelectedCards();
    if (cards.length === 0) return false;
    if (selection?.kind === 'tableau' && selection.index === col) return false;
    if (selection?.kind === 'tableau' && !isValidTableauStack(cards)) return false;

    const targetTop = topCard(tableau[col]);
    if (!canPlaceOnTableau(cards[0], targetTop)) return false;

    recordMove();
    const moved = removeSelectedCards();
    tableau[col].push(...moved);
    clearSelection();
    checkWin();
    return true;
  }

  function tryMoveToFoundation(foundIndex: number): boolean {
    const cards = getSelectedCards();
    if (cards.length !== 1) return false;
    if (selection?.kind === 'foundation' && selection.index === foundIndex) return false;

    const card = cards[0];
    const targetTop = topCard(foundations[foundIndex]);
    if (!canPlaceOnFoundation(card, targetTop)) return false;

    recordMove();
    const moved = removeSelectedCards();
    foundations[foundIndex].push(moved[0]);
    clearSelection();
    checkWin();
    return true;
  }

  function tryAutoMoveToFoundation(source: Selection): boolean {
    selection = { ...source };
    for (let i = 0; i < FOUNDATION_COUNT; i++) {
      if (tryMoveToFoundation(i)) {
        statusEl.textContent = 'Tap or drag cards to play';
        render();
        return true;
      }
    }
    clearSelection();
    render();
    return false;
  }

  function drawFromStock() {
    if (won) return;
    clearSelection();
    pushUndo();

    if (stock.length > 0) {
      const count = Math.min(drawCount, stock.length);
      for (let i = 0; i < count; i++) {
        const card = stock.pop()!;
        card.faceUp = true;
        cardFaceState.set(card.id, false);
        waste.push(card);
      }
      moves += 1;
    } else if (waste.length > 0) {
      while (waste.length > 0) {
        const card = waste.pop()!;
        card.faceUp = false;
        cardFaceState.set(card.id, true);
        stock.push(card);
      }
      moves += 1;
    } else {
      undoStack.pop();
      return;
    }

    dealConfirmPending = false;
    render();
  }

  function toggleDrawCount() {
    if (moves > 0 && !won) return;
    drawCount = drawCount === 1 ? 3 : 1;
    drawBtn.textContent = drawCount === 1 ? 'Draw-1' : 'Draw-3';
    saveGame();
  }

  function canMoveSingleToAnyFoundation(card: Card): boolean {
    for (let i = 0; i < FOUNDATION_COUNT; i++) {
      if (canPlaceOnFoundation(card, topCard(foundations[i]))) return true;
    }
    return false;
  }

  function canMoveStackToAnyTableau(cards: Card[]): boolean {
    if (!isValidTableauStack(cards)) return false;
    for (let col = 0; col < TABLEAU_COUNT; col++) {
      if (canPlaceOnTableau(cards[0], topCard(tableau[col]))) return true;
    }
    return false;
  }

  function hasAnyValidMove(): boolean {
    if (stock.length > 0 || waste.length > 0) return true;

    if (waste.length > 0) {
      const w = waste[waste.length - 1];
      if (canMoveSingleToAnyFoundation(w)) return true;
      if (canMoveStackToAnyTableau([w])) return true;
    }

    for (let col = 0; col < TABLEAU_COUNT; col++) {
      const pile = tableau[col];
      for (let i = pile.length - 1; i >= 0; i--) {
        if (!pile[i].faceUp) break;
        const stack = pile.slice(i);
        if (canMoveSingleToAnyFoundation(stack[0]) && stack.length === 1) return true;
        if (canMoveStackToAnyTableau(stack)) return true;
      }
    }

    for (let fi = 0; fi < FOUNDATION_COUNT; fi++) {
      const card = topCard(foundations[fi]);
      if (!card) continue;
      for (let col = 0; col < TABLEAU_COUNT; col++) {
        if (canPlaceOnTableau(card, topCard(tableau[col]))) return true;
      }
    }

    return false;
  }

  function allTableauFaceUp(): boolean {
    return tableau.every((pile) => pile.every((c) => c.faceUp));
  }

  function findAutoCollectMove(): Selection | null {
    let best: Selection | null = null;
    let bestRank = Infinity;

    const tryCandidate = (sel: Selection, card: Card) => {
      if (!canMoveSingleToAnyFoundation(card)) return;
      if (card.rank < bestRank) {
        best = sel;
        bestRank = card.rank;
      }
    };

    if (waste.length > 0) {
      tryCandidate(
        { kind: 'waste', index: 0, cardIndex: waste.length - 1 },
        waste[waste.length - 1],
      );
    }

    for (let col = 0; col < TABLEAU_COUNT; col++) {
      const pile = tableau[col];
      if (pile.length === 0) continue;
      const top = pile[pile.length - 1];
      if (top.faceUp) {
        tryCandidate({ kind: 'tableau', index: col, cardIndex: pile.length - 1 }, top);
      }
    }

    return best;
  }

  function startAutoCollect() {
    if (!allTableauFaceUp() || won) return;
    stopAutoCollect();
    autoCollectTimer = setInterval(() => {
      const sel = findAutoCollectMove();
      if (!sel) {
        stopAutoCollect();
        return;
      }
      selection = sel;
      for (let i = 0; i < FOUNDATION_COUNT; i++) {
        if (tryMoveToFoundation(i)) {
          render();
          return;
        }
      }
      stopAutoCollect();
    }, 120);
  }

  function stopAutoCollect() {
    if (autoCollectTimer) {
      clearInterval(autoCollectTimer);
      autoCollectTimer = null;
    }
  }

  function handleDestinationTap(kind: PileKind, index: number) {
    if (won || !selection) return;
    let moved = false;
    if (kind === 'tableau') moved = tryMoveToTableau(index);
    else if (kind === 'foundation') moved = tryMoveToFoundation(index);
    if (moved) {
      statusEl.textContent = 'Tap or drag cards to play';
      render();
    } else {
      playSound('invalid');
    }
  }

  function handleCardSelect(kind: PileKind, pileIndex: number, cardIndex: number) {
    if (won || Date.now() < suppressClickUntil) return;

    const same =
      selection?.kind === kind &&
      selection.index === pileIndex &&
      selection.cardIndex === cardIndex;

    if (same) {
      clearSelection();
      render();
      return;
    }

    if (selection) {
      const prev = selection;
      if (kind === 'tableau') {
        if (tryMoveToTableau(pileIndex)) {
          statusEl.textContent = 'Tap or drag cards to play';
          render();
          return;
        }
      } else if (kind === 'foundation') {
        if (tryMoveToFoundation(pileIndex)) {
          statusEl.textContent = 'Tap or drag cards to play';
          render();
          return;
        }
      }
      selection = prev;
      playSound('invalid');
    }

    if (kind === 'waste') {
      if (waste.length === 0) return;
      selection = { kind, index: 0, cardIndex: waste.length - 1 };
    } else if (kind === 'foundation') {
      if (foundations[pileIndex].length === 0) return;
      selection = { kind, index: pileIndex, cardIndex: foundations[pileIndex].length - 1 };
    } else if (kind === 'tableau') {
      const card = tableau[pileIndex][cardIndex];
      if (!card?.faceUp) return;
      selection = { kind, index: pileIndex, cardIndex };
    }

    render();
  }

  function handleCardInteraction(source: Selection, event: MouseEvent) {
    const now = Date.now();
    const near =
      Math.abs(event.clientX - lastTapX) < DRAG_THRESHOLD &&
      Math.abs(event.clientY - lastTapY) < DRAG_THRESHOLD;

    if (near && now - lastTapTime < DOUBLE_TAP_MS) {
      suppressClickUntil = Date.now() + 200;
      lastTapTime = 0;
      tryAutoMoveToFoundation(source);
      return;
    }

    lastTapTime = now;
    lastTapX = event.clientX;
    lastTapY = event.clientY;

    handleCardSelect(source.kind, source.index, source.cardIndex);
  }

  function isSelected(kind: PileKind, pileIndex: number, cardIndex: number): boolean {
    return (
      selection?.kind === kind &&
      selection.index === pileIndex &&
      selection.cardIndex === cardIndex
    );
  }

  function isDragSource(kind: PileKind, pileIndex: number, cardIndex: number): boolean {
    if (!dragSource) return false;
    if (dragSource.kind !== kind || dragSource.index !== pileIndex) return false;
    if (kind === 'waste') return cardIndex === waste.length - 1;
    if (kind === 'tableau') return cardIndex >= dragSource.cardIndex;
    return false;
  }

  function hitTestDropTarget(clientX: number, clientY: number): DropTarget | null {
    for (let i = 0; i < FOUNDATION_COUNT; i++) {
      const zone = foundationZones[i];
      if (zone && pointInRect(clientX, clientY, zone.getBoundingClientRect())) {
        return { kind: 'foundation', index: i };
      }
    }
    for (let col = 0; col < TABLEAU_COUNT; col++) {
      const zone = tableauZones[col];
      if (zone && pointInRect(clientX, clientY, zone.getBoundingClientRect())) {
        return { kind: 'tableau', index: col };
      }
    }
    return null;
  }

  function setDragPosition(clientX: number, clientY: number) {
    if (!dragClone) return;
    dragClone.style.left = `${clientX - dragGrabOffsetX}px`;
    dragClone.style.top = `${clientY - dragGrabOffsetY}px`;
  }

  function cancelDrag(restoreVisibility: boolean) {
    if (restoreVisibility) {
      for (const el of dragSourceElements) el.classList.remove('dragging');
    }
    dragClone?.remove();
    dragClone = null;
    dragPointerId = null;
    dragActive = false;
    dragOriginRect = null;
    dragSourceElements = [];
    dragSource = null;
  }

  function beginDragVisuals(sourceEl: HTMLElement, cards: Card[]) {
    const originRect = sourceEl.getBoundingClientRect();
    dragOriginRect = originRect;
    dragGrabOffsetX = dragStartX - originRect.left;
    dragGrabOffsetY = dragStartY - originRect.top;

    const stack = document.createElement('div');
    stack.className = 'pointer-events-none';
    stack.style.position = 'fixed';
    stack.style.zIndex = '100';
    stack.style.left = `${originRect.left}px`;
    stack.style.top = `${originRect.top}px`;
    stack.style.width = `${originRect.width}px`;

    cards.forEach((card, i) => {
      const src = cardEls.get(card.id);
      if (!src) return;
      const cardEl = src.cloneNode(true) as HTMLElement;
      cardEl.style.position = 'absolute';
      cardEl.style.left = '0';
      cardEl.style.top = `${i * faceUpOffset() * tableauScale}px`;
      cardEl.style.width = `${originRect.width}px`;
      cardEl.style.height = `${originRect.height}px`;
      cardEl.style.boxShadow = '0 8px 24px rgba(0,0,0,0.45)';
      cardEl.classList.remove('dragging', 'hidden');
      stack.append(cardEl);
    });

    dragLayer.append(stack);
    dragClone = stack;
    setDragPosition(dragStartX, dragStartY);
  }

  function animateDragCancel(onDone: () => void) {
    if (!dragClone || !dragOriginRect) {
      onDone();
      return;
    }

    const currentLeft = parseFloat(dragClone.style.left);
    const currentTop = parseFloat(dragClone.style.top);
    const dx = dragOriginRect.left - currentLeft;
    const dy = dragOriginRect.top - currentTop;

    dragClone.style.transition = 'transform 150ms ease-out';
    dragClone.style.transform = `translate(${dx}px, ${dy}px)`;
    playSound('invalid');

    const finish = () => {
      dragClone?.removeEventListener('transitionend', finish);
      onDone();
    };
    dragClone.addEventListener('transitionend', finish);
    window.setTimeout(finish, 180);
  }

  function finishDrag(clientX: number, clientY: number) {
    if (!dragActive || !dragSource) {
      cancelDrag(true);
      return;
    }

    suppressClickUntil = Date.now() + 200;
    selection = { ...dragSource };

    const target = hitTestDropTarget(clientX, clientY);
    let moved = false;
    if (target?.kind === 'tableau') moved = tryMoveToTableau(target.index);
    else if (target?.kind === 'foundation') moved = tryMoveToFoundation(target.index);

    if (moved) {
      cancelDrag(false);
      statusEl.textContent = 'Tap or drag cards to play';
      render();
      return;
    }

    animateDragCancel(() => {
      clearSelection();
      cancelDrag(true);
      render();
    });
  }

  function onDragPointerMove(event: PointerEvent) {
    if (event.pointerId !== dragPointerId || won) return;

    const dx = event.clientX - dragStartX;
    const dy = event.clientY - dragStartY;

    if (!dragActive) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      if (!dragSource) return;

      selection = { ...dragSource };
      const cards = getSelectedCards();
      if (cards.length === 0) return;

      dragActive = true;
      beginDragVisuals(dragSourceElements[0], cards);
      for (const el of dragSourceElements) el.classList.add('dragging');
    }

    setDragPosition(event.clientX, event.clientY);
  }

  function onDragPointerUp(event: PointerEvent) {
    if (event.pointerId !== dragPointerId) return;

    window.removeEventListener('pointermove', onDragPointerMove);
    window.removeEventListener('pointerup', onDragPointerUp);
    window.removeEventListener('pointercancel', onDragPointerUp);

    if (dragActive) {
      event.preventDefault();
      finishDrag(event.clientX, event.clientY);
    } else {
      dragSource = null;
      dragSourceElements = [];
      dragPointerId = null;
    }
  }

  function initBoardStructure() {
    stockBtn = document.createElement('button');
    stockBtn.type = 'button';
    stockBtn.className = 'sol-stock is-empty';
    stockBtn.setAttribute('aria-label', 'Stock pile empty');
    stockBtn.addEventListener('click', drawFromStock);
    stockZone.append(stockBtn);

    for (let i = 0; i < FOUNDATION_COUNT; i++) {
      const zone = document.createElement('div');
      zone.className = 'relative flex justify-center';
      zone.style.minHeight = `${getCardHeight()}px`;
      foundationsRow.append(zone);
      foundationZones[i] = zone;

      const slot = document.createElement('button');
      slot.type = 'button';
      slot.className = 'sol-slot';
      slot.setAttribute('aria-label', `Foundation ${i + 1}`);
      slot.addEventListener('click', () => handleDestinationTap('foundation', i));
      zone.append(slot);
      foundationSlots[i] = slot;
    }

    for (let col = 0; col < TABLEAU_COUNT; col++) {
      const zone = document.createElement('div');
      zone.className = 'relative';
      tableauRow.append(zone);
      tableauZones[col] = zone;

      const slot = document.createElement('button');
      slot.type = 'button';
      slot.className = 'sol-slot';
      slot.setAttribute('aria-label', `Empty column ${col + 1}`);
      slot.addEventListener('click', () => handleDestinationTap('tableau', col));
      zone.append(slot);
      tableauSlots[col] = slot;
    }
  }

  function updateStockButton() {
    if (!stockBtn) return;

    stockBtn.className = 'sol-stock';
    stockBtn.disabled = false;

    if (stock.length > 0) {
      stockBtn.classList.add('has-cards');
      stockBtn.setAttribute('aria-label', 'Draw from stock');
      stockBtn.innerHTML =
        '<div class="sol-stock-back"><span class="sol-card-back-label">BG</span></div>';
    } else if (waste.length > 0) {
      stockBtn.classList.add('can-redo');
      stockBtn.setAttribute('aria-label', 'Recycle waste pile');
      stockBtn.innerHTML = '<span class="sol-stock-icon" aria-hidden="true">&#8635;</span>';
    } else {
      stockBtn.classList.add('is-empty');
      stockBtn.disabled = true;
      stockBtn.setAttribute('aria-label', 'Stock pile empty');
      stockBtn.innerHTML = '';
    }
  }

  function updateSlots() {
    const cardHeight = getCardHeight();
    stockZone.style.minHeight = `${cardHeight}px`;
    wasteZone.style.minHeight = `${cardHeight}px`;

    for (let i = 0; i < FOUNDATION_COUNT; i++) {
      foundationSlots[i].style.display = foundations[i].length === 0 ? 'block' : 'none';
    }
    for (let col = 0; col < TABLEAU_COUNT; col++) {
      tableauSlots[col].style.display = tableau[col].length === 0 ? 'block' : 'none';
      tableauZones[col].style.minHeight = `${tableauColumnHeight(tableau[col], tableauScale)}px`;
    }
  }

  function render() {
    if (dragActive) return;

    tableauScale = computeTableauScale();

    const locations = buildCardLocations();
    const allCards = [...stock, ...waste, ...foundations.flat(), ...tableau.flat()];
    ensureCardElements(allCards);

    for (const card of allCards) {
      updateCardElement(card, locations.get(card.id));
    }

    for (const [id, el] of cardEls) {
      if (!locations.has(id)) el.classList.add('hidden');
    }

    updateStockButton();
    updateSlots();

    collectBtn.style.display = allTableauFaceUp() && !won ? 'inline-block' : 'none';

    if (!won && moves > 0 && !hasAnyValidMove()) {
      statusEl.textContent = 'No moves remain — start a New Deal';
    }

    updateHud();
    saveGame();
  }

  function onResize() {
    if (dragActive) return;
    render();
  }

  function onKeyDown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      undo();
      return;
    }
    if (event.key === 'Escape' && !winOverlay.hidden) {
      resetWinOverlay();
      deal();
      return;
    }
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    requestDeal();
  }

  initBoardStructure();
  ensureCardElements(createDeck());
  resetWinOverlay();

  if (!loadGame()) {
    deal();
  } else {
    undoBtn.disabled = true;
    drawBtn.textContent = drawCount === 1 ? 'Draw-1' : 'Draw-3';
    for (const c of [...stock, ...waste, ...foundations.flat(), ...tableau.flat()]) {
      cardFaceState.set(c.id, c.faceUp);
    }
    render();
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('resize', onResize);

  return () => {
    stopAutoCollect();
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('pointermove', onDragPointerMove);
    window.removeEventListener('pointerup', onDragPointerUp);
    window.removeEventListener('pointercancel', onDragPointerUp);
    root.innerHTML = '';
  };
}
