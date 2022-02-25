import escapeStringRegexp from 'escape-string-regexp';

const HTML_REPLACEMENT_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;'
};

const HTML_ESCAPE_TEST_PATTERN = new RegExp(`[${Object.keys(HTML_REPLACEMENT_MAP).map(escapeStringRegexp).join('')}]`);

const HTML_ESCAPE_REPLACEMENT_PATTERN = new RegExp(HTML_ESCAPE_TEST_PATTERN.source, 'g');

export function escapeHtml(str) {
  return HTML_ESCAPE_TEST_PATTERN.test(str)
    ? str.replace(HTML_ESCAPE_REPLACEMENT_PATTERN, c => HTML_REPLACEMENT_MAP[c])
    : str;
}

export function kebabCaseToCamelCase(str) {
  return str.replace(/-[a-z0-9]/g, c => c.toUpperCase()).replace(/-/g, '');
}

export function shorten(str, maxLength) {
  if (!str || str.length <= maxLength) {
    return str || '';
  }

  return `${str.slice(0, maxLength - 1)}…`;
}
