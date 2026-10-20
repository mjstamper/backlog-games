import { createRequire } from 'node:module';

const nodeRequire = createRequire(import.meta.url);

export const VIRTUAL_MODULE_ID = 'virtual:five-letter-english-words';
const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`;

/**
 * Unambiguous slurs and profanity removed from accepted guesses.
 * Daily answers stay on the curated list in wordGuessLexicon.ts.
 */
const BLOCKED = new Set([
  'bitch',
  'boobs',
  'chink',
  'cocks',
  'coons',
  'cunty',
  'cunts',
  'darky',
  'dicks',
  'dildo',
  'dykes',
  'dykey',
  'faggy',
  'fucks',
  'gooks',
  'gyppo',
  'gyppy',
  'homos',
  'horny',
  'kikes',
  'lesbo',
  'micks',
  'negro',
  'penis',
  'pussy',
  'rapes',
  'shite',
  'shits',
  'skank',
  'sluts',
  'sperm',
  'spick',
  'spics',
  'squaw',
  'titty',
  'twats',
  'wanky',
  'whore',
]);

export function fiveLetterEnglishWordsPlugin() {
  /** @type {string | undefined} */
  let source;

  return {
    name: 'five-letter-english-words',
    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_MODULE_ID;
    },
    load(id) {
      if (id !== RESOLVED_VIRTUAL_MODULE_ID) return null;
      if (source) return source;

      const words = nodeRequire('an-array-of-english-words');
      /** @type {string[]} */
      const fiveLetter = [];
      for (const word of words) {
        if (typeof word !== 'string' || word.length !== 5) continue;
        if (!/^[a-z]+$/.test(word)) continue;
        if (BLOCKED.has(word)) continue;
        fiveLetter.push(word);
      }

      source = `export default ${JSON.stringify(fiveLetter)};`;
      return source;
    },
  };
}
