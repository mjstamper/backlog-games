# October 2026 — Tetris + catalog UX

Theme: first hero new arcade title; improve discoverability on the homepage.

## Deliverables

| Item | Status | Notes |
|------|--------|--------|
| **Tetris (playable)** | Done | [`src/scripts/tetris.ts`](../src/scripts/tetris.ts), registered in [`gameRegistry.ts`](../src/config/gameRegistry.ts). |
| **Homepage search** | Done (scaffold) | [`CatalogControls.astro`](../src/components/CatalogControls.astro) + [`catalog.ts`](../src/scripts/catalog.ts) — filters title, description, tags. |
| **Homepage sort** | Done (scaffold) | Name (A-Z), category, recently added via `addedAt` on each `Game`. |
| **Featured rotation** | Done (scaffold) | [`featured.ts`](../src/config/featured.ts); manual `featured: true` in catalog overrides rotation. |

## Tetris implementation checklist

- [x] 10x20 playfield, standard tetrominoes (simple wall kicks, not full SRS)
- [x] Line clear, score, level speed ramp
- [x] Keyboard (arrows + rotate + hard drop)
- [x] Mobile: [`virtualDpad.ts`](../src/scripts/lib/virtualDpad.ts) + rotate/drop actions
- [x] `localStorage` high score
- [x] Register in `gameRegistry`, catalog `playable`
- [x] README game table + help text on game page

## Featured rotation

- Edit [`src/config/featured.ts`](../src/config/featured.ts) to change the monthly slug map.
- Remove `featured: true` from all games in `site.ts` to use rotation automatically (October default: **tetris**).

## Catalog fields

Each game may set `addedAt` (ISO date) in [`site.ts`](../src/config/site.ts) for “Recently added” sort.
