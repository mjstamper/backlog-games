# January 2027 — Onboarding + related games

Theme: every playable title gets catalog **How to play** copy; game pages suggest **More like this**; finish leftover persistence and control helpers from 2026.

Featured rotation for January is **2048** again ([`featured.ts`](../src/config/featured.ts)) — December already polished it, so this month focuses on cross-game UX, not another 2048 pass.

## Deliverables

| Item | Status | Notes |
|------|--------|--------|
| **Instructions backfill** | Done (scaffold) | `instructions` on all playable games in [`site.ts`](../src/config/site.ts). |
| **Related games block** | Done (scaffold) | [`relatedGames.ts`](../src/config/relatedGames.ts) + [`RelatedGames.astro`](../src/components/RelatedGames.astro) on [`GamePlayerShell.astro`](../src/components/GamePlayerShell.astro). |
| **Solitaire wins → scores.ts** | Done | [`solitaire.ts`](../src/scripts/solitaire.ts) uses `readStoredNumber` / `writeStoredNumber`; key unchanged. |
| **keyboard.ts adoption** | Planned | Space/Enter start + P pause for canvas arcades when touching those files. |
| **gameState.ts overlays** | Planned | Optional `drawStateOverlay` instead of duplicated canvas pause/game-over text. |
| **February Breakout prep** | Planned | Featured slug **breakout** in February — add `instructions` polish + smoke-test paddle/mobile (see checklist). |

## Instructions backfill

Games that lacked catalog instructions now have them in [`site.ts`](../src/config/site.ts). In-game hint lines can stay; the collapsible panel is the canonical rules summary.

| Slug | Status |
|------|--------|
| breakout | Done |
| memory | Done |
| asteroids | Done |
| solitaire | Done |
| minesweeper | Done |
| snake, 2048, tetris, word-guess | Already had instructions |

## Related games

Ranking in [`getRelatedGames()`](../src/config/relatedGames.ts):

- Same category (+2)
- Each shared tag (+1)
- Tie-break by title A–Z

Only `playable` games appear. Adjust weights when adding categories or tags.

## keyboard.ts migration (incremental)

| Game script | Start / restart | Pause | Status |
|-------------|-----------------|-------|--------|
| [`snake.ts`](../src/scripts/snake.ts) | Space / Enter | P | Planned |
| [`breakout.ts`](../src/scripts/breakout.ts) | Space / tap | P | Planned |
| [`asteroids.ts`](../src/scripts/asteroids.ts) | Space | P | Planned |
| [`tetris.ts`](../src/scripts/tetris.ts) | Space (hard drop vs start — keep game-specific) | P | Planned |
| [`memory.ts`](../src/scripts/memory.ts) | Space restart | — | Planned |
| [`minesweeper.ts`](../src/scripts/minesweeper.ts) | Space new game | — | Planned |

Use [`bindArcadeKeys`](../src/scripts/lib/keyboard.ts); keep arrow/WASD handling in each game.

## canvas.ts migration (optional)

When resizing canvas games, prefer [`observeCanvasResize`](../src/scripts/lib/canvas.ts) (2048 already does). Candidates: Snake, Breakout, Asteroids, Tetris.

## February Breakout checklist (prep)

- [ ] Confirm Breakout `instructions` match in-game controls (drag, A/D, mobile)
- [ ] High score still persists via `scores.ts` after any control refactor
- [ ] Homepage featured smoke-test with no manual `featured` flag (February → **breakout**)

## Featured rotation

January default in [`featured.ts`](../src/config/featured.ts): **2048** (no new work required unless bugs).

## Next

February 2027 roadmap (not yet written) — **Breakout** featured-month polish + keyboard lib rollout for arcade titles.
