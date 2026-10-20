export type GameKeyBindings = {
  onStartOrRestart?: () => void;
  onPauseToggle?: () => void;
  onHardAction?: () => void;
  canStart?: () => boolean;
  canPause?: () => boolean;
  canHardAction?: () => boolean;
};

/**
 * Shared Space/Enter start and P pause handling for arcade games.
 * Game-specific arrow keys stay in each game script.
 */
export function bindArcadeKeys(bindings: GameKeyBindings): () => void {
  function onKeyDown(event: KeyboardEvent) {
    const key = event.key.toLowerCase();

    if (key === ' ' || key === 'enter') {
      if (!bindings.onStartOrRestart && !bindings.onHardAction) return;
      event.preventDefault();
      if (bindings.canHardAction?.() && bindings.onHardAction) {
        bindings.onHardAction();
        return;
      }
      if (bindings.canStart?.() !== false && bindings.onStartOrRestart) {
        bindings.onStartOrRestart();
      }
      return;
    }

    if (key === 'p' && bindings.onPauseToggle && bindings.canPause?.()) {
      event.preventDefault();
      bindings.onPauseToggle();
    }
  }

  window.addEventListener('keydown', onKeyDown);
  return () => window.removeEventListener('keydown', onKeyDown);
}
