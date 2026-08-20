type HoldHandlers = {
  onLeft: (pressed: boolean) => void;
  onRight: (pressed: boolean) => void;
  onThrust: (pressed: boolean) => void;
  onFire: () => void;
};

type HoldAction = 'left' | 'right' | 'thrust';

function createHoldButton(label: string, action: HoldAction, handlers: HoldHandlers) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.className =
    'select-none rounded-lg border border-games-border bg-games-surface px-4 py-3 text-sm font-semibold text-games-ink transition-colors active:border-games-accent active:bg-games-surface-hover active:text-games-accent touch-none';

  function setPressed(pressed: boolean) {
    const handler =
      action === 'left'
        ? handlers.onLeft
        : action === 'right'
          ? handlers.onRight
          : handlers.onThrust;
    handler(pressed);
  }

  function onPointerDown(event: PointerEvent) {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    setPressed(true);
  }

  function onPointerUp(event: PointerEvent) {
    if (button.hasPointerCapture(event.pointerId)) {
      button.releasePointerCapture(event.pointerId);
    }
    setPressed(false);
  }

  button.addEventListener('pointerdown', onPointerDown);
  button.addEventListener('pointerup', onPointerUp);
  button.addEventListener('pointercancel', onPointerUp);
  button.addEventListener('pointerleave', (event) => {
    if (button.hasPointerCapture(event.pointerId)) setPressed(false);
  });

  return {
    element: button,
    release: () => setPressed(false),
    destroy: () => {
      button.removeEventListener('pointerdown', onPointerDown);
      button.removeEventListener('pointerup', onPointerUp);
      button.removeEventListener('pointercancel', onPointerUp);
    },
  };
}

export function createVirtualControls(
  container: HTMLElement,
  handlers: HoldHandlers,
): () => void {
  const bar = document.createElement('div');
  bar.className =
    'flex w-full max-w-[640px] gap-2 md:hidden touch-none select-none';
  bar.setAttribute('aria-label', 'Touch game controls');

  const left = createHoldButton('Turn left', 'left', handlers);
  const thrust = createHoldButton('Thrust', 'thrust', handlers);
  const right = createHoldButton('Turn right', 'right', handlers);

  left.element.classList.add('flex-1');
  thrust.element.classList.add('flex-1');
  right.element.classList.add('flex-1');

  const fire = document.createElement('button');
  fire.type = 'button';
  fire.textContent = 'Fire';
  fire.className =
    'select-none rounded-lg border border-games-border bg-games-surface px-4 py-3 text-sm font-semibold text-games-ink transition-colors active:border-games-accent active:bg-games-surface-hover active:text-games-accent touch-none flex-1';

  function onFirePointerDown(event: PointerEvent) {
    event.preventDefault();
    handlers.onFire();
  }

  fire.addEventListener('pointerdown', onFirePointerDown);

  bar.append(left.element, thrust.element, right.element, fire);

  container.append(bar);

  return () => {
    left.release();
    right.release();
    thrust.release();
    left.destroy();
    right.destroy();
    thrust.destroy();
    fire.removeEventListener('pointerdown', onFirePointerDown);
    bar.remove();
  };
}
