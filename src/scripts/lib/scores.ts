export function readStoredNumber(key: string, fallback = 0): number {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

export function writeStoredNumber(key: string, value: number): void {
  localStorage.setItem(key, String(value));
}

/** Returns the new best score after persisting if `value` is higher. */
export function saveHighScore(key: string, value: number, currentBest: number): number {
  if (value <= currentBest) return currentBest;
  writeStoredNumber(key, value);
  return value;
}

/** Returns the new best time (lower is better) after persisting. */
export function saveBestTime(key: string, timeMs: number, currentBest: number): number {
  if (currentBest > 0 && timeMs >= currentBest) return currentBest;
  writeStoredNumber(key, timeMs);
  return timeMs;
}

export function formatElapsedTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}
