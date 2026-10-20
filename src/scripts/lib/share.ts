/** Word Guess (November): build a Wordle-style result grid for clipboard share. */
export type GuessMark = 'correct' | 'present' | 'absent';

const MARK_TEXT: Record<GuessMark, string> = {
  correct: 'G',
  present: 'Y',
  absent: 'X',
};

export function buildShareResultGrid(rows: GuessMark[][]): string {
  return rows.map((row) => row.map((mark) => MARK_TEXT[mark]).join('')).join('\n');
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
