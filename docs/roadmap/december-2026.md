# December 2026 — Scores migration + 2048 spotlight

Theme: consolidate `localStorage` score helpers across legacy games; polish the monthly featured title (**2048**).

## Deliverables

| Item | Status | Notes |
|------|--------|--------|
| **scores.ts adoption** | Done | All arcade/puzzle scripts below use [`scores.ts`](../src/scripts/lib/scores.ts); storage keys unchanged. |
| **2048 polish** | Done | `instructions` in [`site.ts`](../src/config/site.ts); mobile D-pad + Restart action; start-on-first-move parity. |
| **Featured rotation cleanup** | Done | No `featured: true` in [`site.ts`](../src/config/site.ts); homepage uses [`getFeaturedGame()`](../src/config/site.ts) + [`featured.ts`](../src/config/featured.ts). |
| **Word Guess lexicon** | Optional | Expand [`wordGuessLexicon.ts`](../src/scripts/wordGuessLexicon.ts) guess list; keep family-friendly curation. |

## scores.ts migration

Behavior and storage keys stay backward-compatible. High-score games still guard with `if (score > highScore)` before `saveHighScore` (redundant but harmless).

| Game script | Keys / metrics | Helpers | Status |
|-------------|----------------|---------|--------|
| [`snake.ts`](../src/scripts/snake.ts) | High score | `readStoredNumber`, `saveHighScore` | Done |
| [`breakout.ts`](../src/scripts/breakout.ts) | High score | same | Done |
| [`game2048.ts`](../src/scripts/game2048.ts) | High score | same | Done |
| [`asteroids.ts`](../src/scripts/asteroids.ts) | High score | same | Done |
| [`tetris.ts`](../src/scripts/tetris.ts) | High score | same | Done |
| [`memory.ts`](../src/scripts/memory.ts) | Best time | `readStoredNumber`, `saveBestTime`, `formatElapsedTime` | Done |
| [`minesweeper.ts`](../src/scripts/minesweeper.ts) | Best time | same | Done |

### Optional follow-ups (out of scope for this migration)

- [`solitaire.ts`](../src/scripts/solitaire.ts) — win count still uses inline `localStorage` (`WINS_KEY`).
- **Tetris** — `saveHighScore` runs on line clears only (same as pre-migration); soft/hard-drop points can raise the HUD score without persisting until a clear.

## 2048 checklist

- [x] Confirm mobile D-pad + keyboard parity with other grid games
- [x] `instructions` array on the 2048 catalog entry
- [x] Smoke-test featured homepage when no manual `featured` flag is set
- [x] README game table unchanged unless behavior changes

## canvas / keyboard lib (optional)

If editing 2048 or another canvas game anyway:

- [x] [`canvas.ts`](../src/scripts/lib/canvas.ts) — 2048 uses `observeCanvasResize` (DPR / `fitCanvasToGrid` still optional)
- [ ] [`keyboard.ts`](../src/scripts/lib/keyboard.ts) for Space restart / P pause where applicable (2048 keeps inline Space/Enter; no pause)

## Featured rotation

December default in [`featured.ts`](../src/config/featured.ts): **2048**.
