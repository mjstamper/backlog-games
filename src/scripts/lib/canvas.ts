export type FitCanvasOptions = {
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  cols: number;
  rows: number;
  maxCellSize?: number;
  padding?: number;
};

/**
 * Sizes a canvas to fit a grid inside the game mount. Returns the cell size in px.
 */
export function fitCanvasToGrid(options: FitCanvasOptions): number {
  const { root, canvas, cols, rows, maxCellSize = 32, padding = 32 } = options;
  const width = Math.min(root.clientWidth - padding, cols * maxCellSize);
  const cellSize = Math.max(8, Math.floor(width / cols));
  canvas.width = cellSize * cols;
  canvas.height = cellSize * rows;
  canvas.style.height = `${cellSize * rows}px`;
  return cellSize;
}

export function observeCanvasResize(
  root: HTMLElement,
  onResize: () => void,
): () => void {
  const observer = new ResizeObserver(onResize);
  observer.observe(root);
  return () => observer.disconnect();
}
