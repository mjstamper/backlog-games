# November 2026 — Shared utilities + Word Guess

Theme: reduce duplication across games; ship a casual word puzzle with offline-friendly sharing.

## Deliverables

| Item | Status | Notes |
|------|--------|--------|
| **Shared game lib** | Done (scaffold) | [`src/scripts/lib/`](../src/scripts/lib/) — `scores`, `canvas`, `keyboard`, `gameState`, `share` (+ existing `touch`, `virtualDpad`). |
| **Word Guess (playable)** | Done | [`wordGuess.ts`](../src/scripts/wordGuess.ts), [`wordGuessLexicon.ts`](../src/scripts/wordGuessLexicon.ts), [`WordGuessGame.astro`](../src/components/play/WordGuessGame.astro). |
| **How-to-play panel** | Done | Optional `instructions` on `Game` in [`site.ts`](../src/config/site.ts); collapsible panel in [`GamePlayerShell.astro`](../src/components/GamePlayerShell.astro). |

## Shared lib migration (incremental)

Refactor games to use shared helpers when touching a file — no big-bang rewrite required.

| Module | Purpose | Adopted by |
|--------|---------|------------|
| [`scores.ts`](../src/scripts/lib/scores.ts) | `localStorage` high scores, best times, formatting | Word Guess (streak) |
| [`canvas.ts`](../src/scripts/lib/canvas.ts) | Grid canvas sizing + `ResizeObserver` helper | — |
| [`keyboard.ts`](../src/scripts/lib/keyboard.ts) | Space/Enter start, P pause | — |
| [`gameState.ts`](../src/scripts/lib/gameState.ts) | Canvas overlay text for ready/pause/game over | — |
| [`share.ts`](../src/scripts/lib/share.ts) | Word Guess result grid + clipboard copy | Word Guess |
| [`touch.ts`](../src/scripts/lib/touch.ts) / [`virtualDpad.ts`](../src/scripts/lib/virtualDpad.ts) | Mobile input | Snake, 2048, Asteroids, Tetris, Breakout |

## Word Guess checklist

- [x] Static word list + daily answer from local date string (no server)
- [x] 6 guesses, 5 letters; keyboard + on-screen keys
- [x] Tile feedback: correct / present / absent
- [x] Win/lose + streak in `localStorage`
- [x] Share button: copy grid + score line to clipboard ([`share.ts`](../src/scripts/lib/share.ts))
- [x] Set `status: 'playable'` in [`site.ts`](../src/config/site.ts)
- [x] README + `instructions` copy on the game page

## Featured rotation

November default in [`featured.ts`](../src/config/featured.ts): **word-guess**. Homepage featured title comes from rotation unless a catalog entry sets `featured: true` (manual override).

## How-to-play content

Add `instructions: string[]` to any game in [`site.ts`](../src/config/site.ts). The player shell renders a collapsible **How to play** section below the game stage.

## Next

See [December 2026](./december-2026.md) — scores migration + 2048 spotlight.
