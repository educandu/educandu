const ESCAPE_CHAR_MAP = {
  '"': '\\"',
  '\\': '\\\\',
  '\n': '\\A'
};

const ESCAPE_REGEXP = new RegExp(`[${Object.keys(ESCAPE_CHAR_MAP).join('|')}]`, 'g');

export function cssEscape(value) {
  return value.replace(ESCAPE_REGEXP, x => ESCAPE_CHAR_MAP[x]);
}

export function cssQuote(value) {
  return `"${cssEscape(value)}"`;
}

export function cssUrl(value) {
  return `url(${cssQuote(value)})`;
}
