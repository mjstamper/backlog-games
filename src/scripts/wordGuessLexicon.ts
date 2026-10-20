import fiveLetterWords from 'virtual:five-letter-english-words';

/**
 * Curated common 5-letter words used as daily answers.
 * Valid guesses are the five-letter slice of `an-array-of-english-words`
 * (see vite/fiveLetterEnglishWords.mjs), plus any answer not already in that list.
 */
export const WORD_GUESS_ANSWERS: readonly string[] = [
  'about', 'alert', 'apple', 'beach', 'blade', 'blend', 'blind', 'block', 'board', 'brain',
  'brand', 'bread', 'break', 'brick', 'brief', 'bring', 'broad', 'brown', 'build', 'candy',
  'carry', 'catch', 'chain', 'chair', 'charm', 'chart', 'chase', 'chess', 'chill', 'chunk',
  'class', 'clean', 'clear', 'climb', 'clock', 'close', 'cloud', 'coach', 'coast', 'color',
  'couch', 'count', 'court', 'cover', 'craft', 'crash', 'cream', 'cross', 'crowd', 'crown',
  'dance', 'delay', 'draft', 'dream', 'drift', 'drive', 'early', 'earth', 'empty', 'enjoy',
  'entry', 'equal', 'event', 'extra', 'faith', 'field', 'final', 'flame', 'flash', 'fleet',
  'floor', 'flour', 'focus', 'force', 'forge', 'frame', 'fresh', 'front', 'fruit', 'ghost',
  'glass', 'globe', 'grace', 'grade', 'grand', 'grant', 'grape', 'graph', 'grass', 'great',
  'green', 'grind', 'group', 'guard', 'guest', 'guide', 'happy', 'heart', 'heavy', 'honey',
  'horse', 'house', 'human', 'ideal', 'image', 'index', 'inner', 'input', 'issue', 'jolly',
  'judge', 'juice', 'knock', 'label', 'layer', 'learn', 'lemon', 'level', 'light', 'limit',
  'liver', 'local', 'logic', 'lucky', 'lunch', 'magic', 'major', 'maple', 'march', 'match',
  'maybe', 'merry', 'metal', 'meter', 'micro', 'might', 'minor', 'mixed', 'model', 'money',
  'month', 'motor', 'mount', 'mouse', 'mouth', 'movie', 'music', 'night', 'noble', 'noise',
  'north', 'noted', 'novel', 'nurse', 'ocean', 'offer', 'olive', 'onion', 'opera', 'order',
  'other', 'outer', 'owner', 'paint', 'panel', 'paper', 'party', 'patch', 'pause', 'peace',
  'peach', 'phase', 'phone', 'photo', 'piano', 'piece', 'pilot', 'pitch', 'pixel', 'place',
  'plain', 'plane', 'plant', 'plate', 'point', 'pound', 'power', 'press', 'price', 'pride',
  'prime', 'print', 'prize', 'proof', 'proud', 'pulse', 'queen', 'quick', 'quiet', 'quite',
  'quote', 'radio', 'raise', 'range', 'rapid', 'ratio', 'reach', 'react', 'ready', 'realm',
  'rebel', 'refer', 'relax', 'reply', 'reset', 'ridge', 'right', 'river', 'robot', 'rocky',
  'round', 'route', 'royal', 'rural', 'scale', 'scene', 'scope', 'score', 'sense', 'serve',
  'shade', 'shake', 'shape', 'share', 'sharp', 'sheep', 'sheet', 'shift', 'shine', 'shirt',
  'shock', 'shoot', 'shore', 'short', 'sight', 'skill', 'sleep', 'slice', 'slide', 'smart',
  'smile', 'smoke', 'snake', 'solid', 'solve', 'sound', 'south', 'space', 'spare', 'speak',
  'speed', 'spice', 'spine', 'sport', 'spray', 'squad', 'stack', 'stage', 'stake', 'stand',
  'start', 'state', 'steam', 'steel', 'stick', 'still', 'stock', 'stone', 'store', 'storm',
  'story', 'strip', 'study', 'style', 'sugar', 'suite', 'sunny', 'super', 'sweet', 'swing',
  'table', 'taste', 'teach', 'theme', 'thick', 'thing', 'think', 'third', 'those', 'three',
  'tiger', 'tight', 'timer', 'title', 'toast', 'today', 'token', 'total', 'touch', 'tough',
  'tower', 'track', 'trade', 'train', 'treat', 'trend', 'trial', 'tribe', 'trick', 'troop',
  'truck', 'trust', 'truth', 'uncle', 'under', 'union', 'unity', 'until', 'upper', 'urban',
  'usage', 'valid', 'value', 'video', 'virus', 'visit', 'vital', 'voice', 'waste', 'watch',
  'water', 'wheel', 'where', 'which', 'while', 'white', 'whole', 'woman', 'world', 'worry',
  'worth', 'would', 'write', 'wrong', 'young', 'youth', 'zebra',
];

const guessSet = new Set<string>(fiveLetterWords);
for (const word of WORD_GUESS_ANSWERS) guessSet.add(word);

export const WORD_GUESS_VALID_GUESSES: ReadonlySet<string> = guessSet;

export function isValidGuess(word: string): boolean {
  return WORD_GUESS_VALID_GUESSES.has(word.toLowerCase());
}

export function pickDailyAnswer(date = new Date()): string {
  const key = localDateKey(date);
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const index = (hash >>> 0) % WORD_GUESS_ANSWERS.length;
  return WORD_GUESS_ANSWERS[index]!;
}

export function localDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseLocalDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y!, m! - 1, d!);
}
