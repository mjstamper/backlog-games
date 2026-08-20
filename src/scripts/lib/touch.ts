export type SwipeDirection = 'up' | 'down' | 'left' | 'right';

const DEFAULT_MIN_SWIPE = 24;

export function bindTouchInput(
  element: HTMLElement,
  handlers: {
    onSwipe?: (direction: SwipeDirection) => void;
    onTap?: () => void;
    minSwipeDistance?: number;
  },
): () => void {
  let startX = 0;
  let startY = 0;
  let tracking = false;

  function onTouchStart(event: TouchEvent) {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    tracking = true;
  }

  function onTouchEnd(event: TouchEvent) {
    if (!tracking) return;
    tracking = false;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    const min = handlers.minSwipeDistance ?? DEFAULT_MIN_SWIPE;

    if (Math.abs(dx) < min && Math.abs(dy) < min) {
      handlers.onTap?.();
      return;
    }

    if (!handlers.onSwipe) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      handlers.onSwipe(dx > 0 ? 'right' : 'left');
    } else {
      handlers.onSwipe(dy > 0 ? 'down' : 'up');
    }
  }

  function onTouchCancel() {
    tracking = false;
  }

  element.addEventListener('touchstart', onTouchStart, { passive: true });
  element.addEventListener('touchend', onTouchEnd, { passive: true });
  element.addEventListener('touchcancel', onTouchCancel, { passive: true });

  return () => {
    element.removeEventListener('touchstart', onTouchStart);
    element.removeEventListener('touchend', onTouchEnd);
    element.removeEventListener('touchcancel', onTouchCancel);
  };
}

export function bindPointerDrag(
  element: HTMLElement,
  onMove: (clientX: number) => void,
  options?: { onDown?: () => void },
): () => void {
  function onPointerDown(event: PointerEvent) {
    event.preventDefault();
    element.setPointerCapture(event.pointerId);
    options?.onDown?.();
    onMove(event.clientX);
  }

  function onPointerMove(event: PointerEvent) {
    if (!element.hasPointerCapture(event.pointerId)) return;
    onMove(event.clientX);
  }

  function releasePointer(event: PointerEvent) {
    if (element.hasPointerCapture(event.pointerId)) {
      element.releasePointerCapture(event.pointerId);
    }
  }

  element.addEventListener('pointerdown', onPointerDown);
  element.addEventListener('pointermove', onPointerMove);
  element.addEventListener('pointerup', releasePointer);
  element.addEventListener('pointercancel', releasePointer);

  return () => {
    element.removeEventListener('pointerdown', onPointerDown);
    element.removeEventListener('pointermove', onPointerMove);
    element.removeEventListener('pointerup', releasePointer);
    element.removeEventListener('pointercancel', releasePointer);
  };
}
