# December 2026 — Scores migration + 2048 spotlight

Theme: consolidate `localStorage` score helpers across legacy games; polish the monthly featured title (**2048**).

## Deliverables

| Item | Status | Notes |
|------|--------|--------|
| **scores.ts adoption** | Scaffold | Replace inline `localStorage` + `formatTime` duplicates in arcade/puzzle scripts with [`scores.ts`](../src/scripts/lib/scores.ts). |
| **2048 polish** | Planned | Featured slug for December in [`featured.ts`](../src/config/featured.ts); add `instructions` in [`site.ts`](../src/config/site.ts) if missing. |
| **Featured rotation cleanup** | Planned | Clear manual `featured: true` overrides in [`site.ts`](../src/config/site.ts) so [`featured.ts`](../src/config/featured.ts) drives the homepage. |
| **Word Guess lexicon** | Optional | Expand [`wordGuessLexicon.ts`](../src/scripts/wordGuessLexicon.ts) guess list; keep family-friendly curation. |

## scores.ts migration (incremental)

Touch one game at a time; behavior and storage keys must stay backward-compatible.

| Game script | Keys / metrics | Helpers to use |
|-------------|----------------|----------------|
| [`snake.ts`](../src/scripts/snake.ts) | High score | `readStoredNumber`, `saveHighScore` |
| [`breakout.ts`](../src/scripts/breakout.ts) | High score | same |
| [`game2048.ts`](../src/scripts/game2048.ts) | High score | same |
| [`asteroids.ts`](../src/scripts/asteroids.ts) | High score | same |
| [`tetris.ts`](../src/scripts/tetris.ts) | High score | same |
| [`memory.ts`](../src/scripts/memory.ts) | Best time | `readStoredNumber`, `saveBestTime`, `formatElapsedTime` |
| [`minesweeper.ts`](../src/scripts/minesweeper.ts) | Best time | same |

## 2048 checklist

- [ ] Confirm mobile D-pad + keyboard parity with other grid games
- [ ] `instructions` array on the 2048 catalog entry
- [ ] Smoke-test featured homepage when no manual `featured` flag is set
- [ ] README game table unchanged unless behavior changes

## canvas / keyboard lib (optional)

If editing 2048 or another canvas game anyway:

- [ ] [`canvas.ts`](../src/scripts/lib/canvas.ts) for resize + DPR sizing
- [ ] [`keyboard.ts`](../src/scripts/lib/keyboard.ts) for Space restart / P pause where applicable

## Featured rotation

December default in [`featured.ts`](../src/config/featured.ts): **2048**.
