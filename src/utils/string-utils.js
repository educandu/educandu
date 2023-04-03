import escapeStringRegexp from 'escape-string-regexp';

const HTML_REPLACEMENT_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;'
};

const MARKDOWN_REPLACEMENT_MAP = {
  '*': '\\*',
  '#': '\\#',
  '/': '\\/',
  '(': '\\(',
  ')': '\\)',
  '[': '\\[',
  ']': '\\]',
  '<': '&lt;',
  '>': '&gt;',
  '_': '\\_',
  '`': '\\`'
};

const HTML_ESCAPE_TEST_PATTERN = new RegExp(`[${Object.keys(HTML_REPLACEMENT_MAP).map(escapeStringRegexp).join('')}]`);
const MARKDOWN_ESCAPE_TEST_PATTERN = new RegExp(`[${Object.keys(MARKDOWN_REPLACEMENT_MAP).map(escapeStringRegexp).join('')}]`);

const HTML_ESCAPE_REPLACEMENT_PATTERN = new RegExp(HTML_ESCAPE_TEST_PATTERN.source, 'g');
const MARKDOWN_ESCAPE_REPLACEMENT_PATTERN = new RegExp(MARKDOWN_ESCAPE_TEST_PATTERN.source, 'g');

export const NO_BREAK_SPACE = '\u00A0';
export const ZERO_WIDTH_SPACE = '\u200B';

export function escapeHtml(str) {
  return HTML_ESCAPE_TEST_PATTERN.test(str)
    ? str.replace(HTML_ESCAPE_REPLACEMENT_PATTERN, c => HTML_REPLACEMENT_MAP[c])
    : str;
}

export function escapeMarkdown(str) {
  return MARKDOWN_ESCAPE_TEST_PATTERN.test(str)
    ? str.replace(MARKDOWN_ESCAPE_REPLACEMENT_PATTERN, c => MARKDOWN_REPLACEMENT_MAP[c])
    : str;
}

export function kebabCaseToCamelCase(str) {
  return str.replace(/-[a-z0-9]/g, c => c.toUpperCase()).replace(/-/g, '');
}

export function hyphenizeExpression(expression) {
  return expression.split(' ').join('-');
}

export function makeCompoundWord(expression, language) {
  return language === 'de'
    ? hyphenizeExpression(expression)
    : expression;
}

export function shorten(str, maxLength) {
  if (!str || str.length <= maxLength) {
    return str || '';
  }

  return `${str.slice(0, maxLength - 1)}…`;
}

export function isLetter(char) {
  return (/^\p{L}+$/u).test(char);
}

export function splitAroundWords(word) {
  const unicodeChars = Array.from(word);
  const tokens = [];
  let isInWord = false;
  for (const char of unicodeChars) {
    if (isLetter(char)) {
      if (isInWord) {
        tokens[tokens.length - 1] = tokens[tokens.length - 1] + char;
      } else {
        tokens.push(char);
        isInWord = true;
      }
    } else {
      tokens.push(char);
      isInWord = false;
    }
  }
  return tokens;
}

function tryRenderInlineValue(value) {
  if (['undefined', 'function', 'symbol'].includes(typeof value)) {
    return [true, `(${typeof value})`];
  }
  if (value === null) {
    return [true, '(null)'];
  }
  if (value instanceof Date) {
    return [true, `${value.toISOString()}`];
  }
  if (Array.isArray(value) && !value.length) {
    return [true, '(empty)'];
  }
  if (typeof value === 'string' && !value.length) {
    return [true, '(empty)'];
  }
  if (typeof value === 'object') {
    return [false, null];
  }
  return [true, `${value}`];
}

function renderBlockValue(value) {
  const lines = [];
  if (Array.isArray(value)) {
    value.forEach(val => {
      const [isInlineValue, renderedInlineValue] = tryRenderInlineValue(val);
      if (isInlineValue) {
        lines.push(`- ${renderedInlineValue}`);
      } else {
        renderBlockValue(val).forEach((line, index) => {
          lines.push(`${index === 0 ? '- ' : '  '}${line}`);
        });
      }
    });
  } else {
    Object.entries(value).forEach(([key, val]) => {
      const [isInlineValue, renderedInlineValue] = tryRenderInlineValue(val);
      if (isInlineValue) {
        lines.push(`${key}: ${renderedInlineValue}`);
      } else {
        lines.push(`${key}:`);
        renderBlockValue(val).forEach(line => {
          lines.push(`  ${line}`);
        });
      }
    });
  }
  return lines;
}

export function prettyPrintValue(value) {
  const [isInlineValue, renderedInlineValue] = tryRenderInlineValue(value);
  return isInlineValue ? renderedInlineValue : renderBlockValue(value).join('\n');
}
