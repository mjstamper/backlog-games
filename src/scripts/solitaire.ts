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

const WINS_KEY = 'backloggames-solitaire-wins';

const RANK_LABELS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUIT_SYMBOL: Record<Suit, string> = {
  hearts: '\u2665',
  diamonds: '\u2666',
  clubs: '\u2663',
  spades: '\u2660',
};

const TABLEAU_COUNT = 7;
const FOUNDATION_COUNT = 4;

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

export function initSolitaire(root: HTMLElement): () => void {
  root.innerHTML = '';
  root.className =
    'flex min-h-[420px] w-full flex-col items-center gap-3 p-2 sm:p-4';

  const hud = document.createElement('div');
  hud.className =
    'flex w-full max-w-3xl flex-wrap items-center justify-between gap-2 text-sm text-games-ink-muted';

  const movesEl = document.createElement('span');
  movesEl.textContent = 'Moves: 0';

  const winsEl = document.createElement('span');
  const savedWins = Number(localStorage.getItem(WINS_KEY) ?? 0);
  winsEl.textContent = `Wins: ${savedWins}`;

  const statusEl = document.createElement('span');
  statusEl.className = 'text-games-accent';
  statusEl.textContent = 'Tap cards to play';

  hud.append(movesEl, winsEl, statusEl);

  const board = document.createElement('div');
  board.className = 'w-full max-w-3xl touch-manipulation select-none';

  const topRow = document.createElement('div');
  topRow.className = 'mb-3 grid grid-cols-7 gap-1 sm:gap-2';

  const stockEl = document.createElement('div');
  stockEl.className = 'col-span-1 flex justify-center';
  const wasteEl = document.createElement('div');
  wasteEl.className = 'col-span-1 flex justify-center';
  const spacer = document.createElement('div');
  spacer.className = 'col-span-1 hidden sm:block';
  const foundationsEl = document.createElement('div');
  foundationsEl.className = 'col-span-4 grid grid-cols-4 gap-1 sm:col-span-3 sm:gap-2';

  topRow.append(stockEl, wasteEl, spacer, foundationsEl);

  const tableauEl = document.createElement('div');
  tableauEl.className = 'grid grid-cols-7 gap-1 sm:gap-2';

  board.append(topRow, tableauEl);

  const help = document.createElement('p');
  help.className = 'text-center text-xs text-games-ink-muted';
  help.textContent =
    'Tap stock to draw. Tap a card, then tap where to move it. Space for new deal.';

  root.append(hud, board, help);

  let tableau: Card[][] = [];
  let foundations: Card[][] = [[], [], [], []];
  let stock: Card[] = [];
  let waste: Card[] = [];
  let moves = 0;
  let wins = savedWins;
  let selection: Selection | null = null;
  let won = false;

  function topCard(pile: Card[]): Card | null {
    return pile.length > 0 ? pile[pile.length - 1] : null;
  }

  function deal() {
    const deck = shuffle(createDeck());
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
        tableau[col].push(card);
      }
    }
    stock = deck.slice(index);
    updateHud();
    render();
  }

  function updateHud() {
    movesEl.textContent = `Moves: ${moves}`;
    winsEl.textContent = `Wins: ${wins}`;
  }

  function checkWin() {
    const total = foundations.reduce((sum, pile) => sum + pile.length, 0);
    if (total === 52) {
      won = true;
      wins += 1;
      localStorage.setItem(WINS_KEY, String(wins));
      statusEl.textContent = 'You win! Space for new deal';
      updateHud();
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

  function tryMoveToTableau(col: number): boolean {
    const cards = getSelectedCards();
    if (cards.length === 0) return false;
    if (selection?.kind === 'tableau' && selection.index === col) return false;
    if (selection?.kind === 'tableau' && !isValidTableauStack(cards)) return false;

    const targetTop = topCard(tableau[col]);
    if (!canPlaceOnTableau(cards[0], targetTop)) return false;

    const moved = removeSelectedCards();
    tableau[col].push(...moved);
    moves += 1;
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

    const moved = removeSelectedCards();
    foundations[foundIndex].push(moved[0]);
    moves += 1;
    clearSelection();
    checkWin();
    return true;
  }

  function drawFromStock() {
    if (won) return;
    clearSelection();
    if (stock.length > 0) {
      const card = stock.pop()!;
      card.faceUp = true;
      waste.push(card);
      moves += 1;
    } else if (waste.length > 0) {
      while (waste.length > 0) {
        const card = waste.pop()!;
        card.faceUp = false;
        stock.push(card);
      }
      moves += 1;
    }
    render();
  }

  function handleDestinationTap(kind: PileKind, index: number) {
    if (won || !selection) return;
    let moved = false;
    if (kind === 'tableau') moved = tryMoveToTableau(index);
    else if (kind === 'foundation') moved = tryMoveToFoundation(index);
    if (moved) {
      statusEl.textContent = 'Tap cards to play';
      render();
    }
  }

  function handleCardSelect(kind: PileKind, pileIndex: number, cardIndex: number) {
    if (won) return;

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
          statusEl.textContent = 'Tap cards to play';
          render();
          return;
        }
      } else if (kind === 'foundation') {
        if (tryMoveToFoundation(pileIndex)) {
          statusEl.textContent = 'Tap cards to play';
          render();
          return;
        }
      }
      selection = prev;
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

  function cardClasses(card: Card | null, selected: boolean, slot = false): string {
    const base =
      'relative flex h-14 w-10 flex-col items-center justify-center rounded-md border text-xs font-bold transition-colors sm:h-[4.5rem] sm:w-12 sm:text-sm';
    if (slot) {
      return `${base} border-dashed border-games-border bg-games-canvas/60`;
    }
    if (!card) return `${base} border-dashed border-games-border bg-games-canvas/40`;
    if (!card.faceUp) {
      return `${base} border-games-accent/40 bg-games-surface`;
    }
    const color = isRed(card.suit) ? 'text-[#e85d5d]' : 'text-games-ink';
    const ring = selected ? 'border-games-accent ring-2 ring-games-accent/50' : 'border-games-border bg-games-surface-hover';
    return `${base} ${color} ${ring}`;
  }

  function renderCardFace(card: Card): string {
    return `
      <span class="leading-none">${RANK_LABELS[card.rank - 1]}</span>
      <span class="text-base leading-none sm:text-lg">${SUIT_SYMBOL[card.suit]}</span>
    `;
  }

  function renderCardBack(): string {
    return '<span class="text-games-accent/60 text-lg">BG</span>';
  }

  function isSelected(kind: PileKind, pileIndex: number, cardIndex: number): boolean {
    return (
      selection?.kind === kind &&
      selection.index === pileIndex &&
      selection.cardIndex === cardIndex
    );
  }

  function renderStock() {
    stockEl.innerHTML = '';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = cardClasses(null, false);
    btn.setAttribute('aria-label', 'Stock pile');
    if (stock.length > 0) {
      btn.innerHTML = renderCardBack();
      btn.classList.add('border-games-accent/60');
    } else if (waste.length > 0) {
      btn.innerHTML = '<span class="text-[10px] text-games-ink-muted">Redo</span>';
    } else {
      btn.innerHTML = '<span class="text-[10px] text-games-ink-muted">Empty</span>';
    }
    btn.addEventListener('click', drawFromStock);
    stockEl.append(btn);
  }

  function renderWaste() {
    wasteEl.innerHTML = '';
    const top = topCard(waste);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = cardClasses(top, isSelected('waste', 0, waste.length - 1));
    btn.setAttribute('aria-label', 'Waste pile');
    if (top) {
      btn.innerHTML = renderCardFace(top);
      btn.addEventListener('click', () => handleCardSelect('waste', 0, waste.length - 1));
    }
    wasteEl.append(btn);
  }

  function renderFoundations() {
    foundationsEl.innerHTML = '';
    for (let i = 0; i < FOUNDATION_COUNT; i++) {
      const pile = foundations[i];
      const top = topCard(pile);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = cardClasses(top, isSelected('foundation', i, pile.length - 1), !top);
      btn.setAttribute('aria-label', `Foundation ${i + 1}`);
      if (top) {
        btn.innerHTML = renderCardFace(top);
        btn.addEventListener('click', () => {
          if (selection) handleDestinationTap('foundation', i);
          else handleCardSelect('foundation', i, pile.length - 1);
        });
      } else {
        btn.innerHTML = '<span class="text-games-ink-muted/40 text-lg">A</span>';
        btn.addEventListener('click', () => handleDestinationTap('foundation', i));
      }
      foundationsEl.append(btn);
    }
  }

  function renderTableau() {
    tableauEl.innerHTML = '';
    for (let col = 0; col < TABLEAU_COUNT; col++) {
      const pile = tableau[col];
      const colEl = document.createElement('div');
      colEl.className = 'relative min-h-[5.5rem] sm:min-h-[6.5rem]';

      if (pile.length === 0) {
        const slot = document.createElement('button');
        slot.type = 'button';
        slot.className = `${cardClasses(null, false, true)} absolute left-1/2 top-0 -translate-x-1/2`;
        slot.setAttribute('aria-label', `Empty column ${col + 1}`);
        slot.addEventListener('click', () => handleDestinationTap('tableau', col));
        colEl.append(slot);
      } else {
        pile.forEach((card, cardIndex) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          const offset = cardIndex * 14;
          btn.style.top = `${offset}px`;
          btn.className = `${cardClasses(card, isSelected('tableau', col, cardIndex))} absolute left-1/2 -translate-x-1/2`;
          btn.setAttribute('aria-label', `${RANK_LABELS[card.rank - 1]} of ${card.suit}`);
          btn.innerHTML = card.faceUp ? renderCardFace(card) : renderCardBack();
          btn.addEventListener('click', () => {
            if (selection && !isSelected('tableau', col, cardIndex)) {
              handleDestinationTap('tableau', col);
            } else {
              handleCardSelect('tableau', col, cardIndex);
            }
          });
          colEl.append(btn);
        });
      }

      tableauEl.append(colEl);
    }
  }

  function render() {
    renderStock();
    renderWaste();
    renderFoundations();
    renderTableau();
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    deal();
  }

  window.addEventListener('keydown', onKeyDown);
  deal();

  return () => {
    window.removeEventListener('keydown', onKeyDown);
    root.innerHTML = '';
  };
}
