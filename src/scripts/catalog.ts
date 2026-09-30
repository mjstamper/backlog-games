export type CatalogSort = 'name' | 'category' | 'recent';

function normalizeQuery(value: string): string {
  return value.trim().toLowerCase();
}

function getCards(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('.game-card')];
}

function getGrid(): HTMLElement | null {
  return document.getElementById('game-grid');
}

function compareCards(a: HTMLElement, b: HTMLElement, sort: CatalogSort): number {
  if (sort === 'recent') {
    const aTime = Number(a.dataset.addedAt ?? 0);
    const bTime = Number(b.dataset.addedAt ?? 0);
    if (aTime !== bTime) return bTime - aTime;
  }

  if (sort === 'category') {
    const cat = (a.dataset.category ?? '').localeCompare(b.dataset.category ?? '');
    if (cat !== 0) return cat;
  }

  return (a.dataset.sortName ?? '').localeCompare(b.dataset.sortName ?? '');
}

function reorderGrid(cards: HTMLElement[], sort: CatalogSort) {
  const grid = getGrid();
  if (!grid) return;
  const sorted = [...cards].sort((a, b) => compareCards(a, b, sort));
  for (const card of sorted) grid.append(card);
}

function applyCatalogFilters() {
  const searchInput = document.getElementById('catalog-search') as HTMLInputElement | null;
  const sortSelect = document.getElementById('catalog-sort') as HTMLSelectElement | null;
  const activeCategory =
    document.querySelector<HTMLButtonElement>('.category-filter[aria-pressed="true"]')?.dataset
      .category ?? 'all';

  const query = normalizeQuery(searchInput?.value ?? '');
  const sort = (sortSelect?.value ?? 'recent') as CatalogSort;
  const cards = getCards();

  for (const card of cards) {
    const haystack = card.dataset.searchText ?? '';
    const matchesSearch = query.length === 0 || haystack.includes(query);
    const matchesCategory =
      activeCategory === 'all' || card.dataset.category === activeCategory;
    card.style.display = matchesSearch && matchesCategory ? '' : 'none';
  }

  reorderGrid(cards, sort);
}

export function initCatalogControls(): () => void {
  const searchInput = document.getElementById('catalog-search');
  const sortSelect = document.getElementById('catalog-sort');
  const categoryButtons = document.querySelectorAll<HTMLButtonElement>('.category-filter');

  const onSearch = () => applyCatalogFilters();
  const onSort = () => applyCatalogFilters();

  searchInput?.addEventListener('input', onSearch);
  sortSelect?.addEventListener('change', onSort);

  categoryButtons.forEach((button) => {
    button.addEventListener('click', () => {
      categoryButtons.forEach((other) =>
        other.setAttribute('aria-pressed', String(other === button)),
      );
      applyCatalogFilters();
    });
  });

  applyCatalogFilters();

  return () => {
    searchInput?.removeEventListener('input', onSearch);
    sortSelect?.removeEventListener('change', onSort);
  };
}
