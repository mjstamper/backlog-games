/** Common arcade-style states used across canvas games. */
export type ArcadeGameState = 'ready' | 'playing' | 'paused' | 'gameover';

export type OverlayColors = {
  backdrop: string;
  title: string;
  subtitle: string;
};

const DEFAULT_OVERLAY_COLORS: OverlayColors = {
  backdrop: 'rgba(15, 20, 25, 0.72)',
  title: '#f4f1ea',
  subtitle: '#9aa6b3',
};

export function drawStateOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  title: string,
  subtitle: string,
  colors: OverlayColors = DEFAULT_OVERLAY_COLORS,
): void {
  ctx.fillStyle = colors.backdrop;
  ctx.fillRect(0, 0, width, height);
  ctx.textAlign = 'center';
  ctx.fillStyle = colors.title;
  ctx.font = 'bold 18px Inter, sans-serif';
  ctx.fillText(title, width / 2, height / 2 - 8);
  ctx.fillStyle = colors.subtitle;
  ctx.font = '13px Inter, sans-serif';
  ctx.fillText(subtitle, width / 2, height / 2 + 16);
}
