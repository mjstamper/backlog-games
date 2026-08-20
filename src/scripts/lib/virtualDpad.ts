export type DpadDirection = 'up' | 'down' | 'left' | 'right';

export type ActionButtonConfig = {
  label: string;
  ariaLabel?: string;
  onPress?: () => void;
  onHold?: (pressed: boolean) => void;
};

export type VirtualGameControlsOptions = {
  /** 'press' = single trigger on touch; 'hold' = true/false while held */
  dpadMode?: 'press' | 'hold';
  onDpad?: (direction: DpadDirection, pressed: boolean) => void;
  /** Defaults to all four directions */
  dpadDirections?: DpadDirection[];
  actions?: ActionButtonConfig[];
  /** Hide controls at md breakpoint and above (default true) */
  mobileOnly?: boolean;
};

const DPAD_STYLES = `
.vgc-root {
  display: none;
  width: 100%;
  max-width: 640px;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
@media (max-width: 767px) {
  .vgc-root { display: flex; }
}
.vgc-root.vgc-always { display: flex; }
.vgc-layout {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.vgc-dpad {
  display: grid;
  grid-template-columns: repeat(3, 3.25rem);
  grid-template-rows: repeat(3, 3.25rem);
  gap: 0.35rem;
  flex-shrink: 0;
}
.vgc-dpad-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 0.5rem;
  border: 1px solid #2b3543;
  background: #19212b;
  color: #f4f1ea;
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  transition: border-color 120ms ease, background 120ms ease, color 120ms ease, transform 80ms ease;
}
.vgc-dpad-btn:active,
.vgc-dpad-btn.is-active {
  border-color: #7ee787;
  background: #222c38;
  color: #7ee787;
  transform: scale(0.96);
}
.vgc-dpad-btn:disabled {
  visibility: hidden;
  pointer-events: none;
}
.vgc-dpad-up { grid-column: 2; grid-row: 1; }
.vgc-dpad-left { grid-column: 1; grid-row: 2; }
.vgc-dpad-center {
  grid-column: 2;
  grid-row: 2;
  border-style: dashed;
  opacity: 0.35;
  pointer-events: none;
  font-size: 0.5rem;
  color: #9aa6b3;
}
.vgc-dpad-right { grid-column: 3; grid-row: 2; }
.vgc-dpad-down { grid-column: 2; grid-row: 3; }
.vgc-actions {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
}
.vgc-action-btn {
  flex: 1;
  min-height: 2.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #2b3543;
  background: #19212b;
  color: #f4f1ea;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
  touch-action: none;
  user-select: none;
  transition: border-color 120ms ease, background 120ms ease, color 120ms ease, transform 80ms ease;
}
.vgc-action-btn:active,
.vgc-action-btn.is-active {
  border-color: #7ee787;
  background: #222c38;
  color: #7ee787;
  transform: scale(0.98);
}
.vgc-dpad-only .vgc-layout {
  justify-content: center;
}
`;

const ALL_DIRECTIONS: DpadDirection[] = ['up', 'down', 'left', 'right'];

const DPAD_ARIA: Record<DpadDirection, string> = {
  up: 'Move up',
  down: 'Move down',
  left: 'Move left',
  right: 'Move right',
};

const DPAD_GLYPH: Record<DpadDirection, string> = {
  up: '\u2191',
  down: '\u2193',
  left: '\u2190',
  right: '\u2192',
};

const DPAD_CLASS: Record<DpadDirection, string> = {
  up: 'vgc-dpad-up',
  down: 'vgc-dpad-down',
  left: 'vgc-dpad-left',
  right: 'vgc-dpad-right',
};

let stylesInjected = false;

function ensureStyles(): void {
  if (stylesInjected) return;
  const style = document.createElement('style');
  style.textContent = DPAD_STYLES;
  document.head.append(style);
  stylesInjected = true;
}

type HoldControl = {
  release: () => void;
  destroy: () => void;
};

function bindHoldControl(
  element: HTMLElement,
  onChange: (pressed: boolean) => void,
): HoldControl {
  function setPressed(pressed: boolean, active: boolean) {
    element.classList.toggle('is-active', active);
    onChange(pressed);
  }

  function onPointerDown(event: PointerEvent) {
    event.preventDefault();
    element.setPointerCapture(event.pointerId);
    setPressed(true, true);
  }

  function onPointerUp(event: PointerEvent) {
    if (element.hasPointerCapture(event.pointerId)) {
      element.releasePointerCapture(event.pointerId);
    }
    setPressed(false, false);
  }

  function onPointerLeave(event: PointerEvent) {
    if (element.hasPointerCapture(event.pointerId)) {
      setPressed(false, false);
    }
  }

  element.addEventListener('pointerdown', onPointerDown);
  element.addEventListener('pointerup', onPointerUp);
  element.addEventListener('pointercancel', onPointerUp);
  element.addEventListener('pointerleave', onPointerLeave);

  return {
    release: () => setPressed(false, false),
    destroy: () => {
      element.removeEventListener('pointerdown', onPointerDown);
      element.removeEventListener('pointerup', onPointerUp);
      element.removeEventListener('pointercancel', onPointerUp);
      element.removeEventListener('pointerleave', onPointerLeave);
    },
  };
}

function createDpadButton(
  direction: DpadDirection,
  enabled: boolean,
  mode: 'press' | 'hold',
  onDpad: (direction: DpadDirection, pressed: boolean) => void,
  holdControls: HoldControl[],
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `vgc-dpad-btn ${DPAD_CLASS[direction]}`;
  button.textContent = DPAD_GLYPH[direction];
  button.setAttribute('aria-label', DPAD_ARIA[direction]);
  button.disabled = !enabled;

  if (!enabled) return button;

  if (mode === 'hold') {
    holdControls.push(
      bindHoldControl(button, (pressed) => {
        onDpad(direction, pressed);
      }),
    );
  } else {
    function onPointerDown(event: PointerEvent) {
      event.preventDefault();
      button.classList.add('is-active');
      onDpad(direction, true);
      window.setTimeout(() => button.classList.remove('is-active'), 120);
    }

    button.addEventListener('pointerdown', onPointerDown);
    holdControls.push({
      release: () => button.classList.remove('is-active'),
      destroy: () => button.removeEventListener('pointerdown', onPointerDown),
    });
  }

  return button;
}

function createActionButton(config: ActionButtonConfig, holdControls: HoldControl[]): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'vgc-action-btn';
  button.textContent = config.label;
  button.setAttribute('aria-label', config.ariaLabel ?? config.label);

  if (config.onHold) {
    holdControls.push(
      bindHoldControl(button, (pressed) => {
        config.onHold?.(pressed);
      }),
    );
  } else if (config.onPress) {
    function onPointerDown(event: PointerEvent) {
      event.preventDefault();
      button.classList.add('is-active');
      config.onPress?.();
      window.setTimeout(() => button.classList.remove('is-active'), 120);
    }

    button.addEventListener('pointerdown', onPointerDown);
    holdControls.push({
      release: () => button.classList.remove('is-active'),
      destroy: () => button.removeEventListener('pointerdown', onPointerDown),
    });
  }

  return button;
}

/** On-screen D-pad and optional action buttons for mobile action games. */
export function createVirtualGameControls(
  container: HTMLElement,
  options: VirtualGameControlsOptions,
): () => void {
  ensureStyles();

  const mode = options.dpadMode ?? 'press';
  const directions = options.dpadDirections ?? ALL_DIRECTIONS;
  const enabled = new Set(directions);
  const holdControls: HoldControl[] = [];

  const root = document.createElement('div');
  root.className = options.mobileOnly === false ? 'vgc-root vgc-always' : 'vgc-root';
  root.setAttribute('aria-label', 'Touch game controls');

  const layout = document.createElement('div');
  layout.className = 'vgc-layout';

  const dpad = document.createElement('div');
  dpad.className = 'vgc-dpad';
  dpad.setAttribute('role', 'group');
  dpad.setAttribute('aria-label', 'Directional pad');

  const onDpad = options.onDpad ?? (() => undefined);

  dpad.append(
    createDpadButton('up', enabled.has('up'), mode, onDpad, holdControls),
    createDpadButton('left', enabled.has('left'), mode, onDpad, holdControls),
    (() => {
      const hub = document.createElement('div');
      hub.className = 'vgc-dpad-btn vgc-dpad-center';
      hub.setAttribute('aria-hidden', 'true');
      hub.textContent = '\u00b7';
      return hub;
    })(),
    createDpadButton('right', enabled.has('right'), mode, onDpad, holdControls),
    createDpadButton('down', enabled.has('down'), mode, onDpad, holdControls),
  );

  layout.append(dpad);

  if (options.actions && options.actions.length > 0) {
    const actions = document.createElement('div');
    actions.className = 'vgc-actions';
    actions.setAttribute('role', 'group');
    actions.setAttribute('aria-label', 'Action buttons');
    for (const config of options.actions) {
      actions.append(createActionButton(config, holdControls));
    }
    layout.append(actions);
  } else {
    root.classList.add('vgc-dpad-only');
  }

  root.append(layout);
  container.append(root);

  return () => {
    for (const control of holdControls) {
      control.release();
      control.destroy();
    }
    root.remove();
  };
}

/** D-pad only — convenience wrapper around createVirtualGameControls. */
export function createVirtualDpad(
  container: HTMLElement,
  options: Omit<VirtualGameControlsOptions, 'actions'>,
): () => void {
  return createVirtualGameControls(container, options);
}
