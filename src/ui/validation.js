// Copied from: https://urlregex.com/
// eslint-disable-next-line max-len
const URL_REGEX = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www\.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w\-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[.!/\\\w]*))?)/;

export function formatListWithOr(list, t) {
  return list.reduce((message, item, index) => {
    if (index === 0) {
      return message + t('validation:orListFirstItem', { item });
    }
    if (index === list.length - 1) {
      return message + t('validation:orListLastItem', { item });
    }
    return message + t('validation:orListOtherItem', { item });
  }, '');
}

export const MARKDOWN_REGEX_BOLD_OR_ITALIC_WITHIN_HEADERS = /^[#]+\s*[_*]+.+[_*]+\s*[#]*\s*$/m;

export function validateUrl(
  url,
  t,
  { allowEmpty = false, allowHttp = false, allowMailto = false } = { allowEmpty: false, allowHttp: false, allowMailto: false }
) {
  let validateStatus;
  let help;

  const protocol = (url || '').split(':')[0] || '';

  const allowedProtocols = ['https'];
  if (allowHttp) {
    allowedProtocols.push('http');
  }
  if (allowMailto) {
    allowedProtocols.push('mailto');
  }

  if (!url) {
    validateStatus = allowEmpty ? 'success' : 'warning';
    help = allowEmpty ? null : t('validation:urlRequired');
  } else if (!URL_REGEX.test(url)) {
    validateStatus = 'error';
    help = t('validation:urlInvalid');
  } else if (!allowedProtocols.includes(protocol)) {
    validateStatus = 'error';
    help = t('validation:urlInvalidProtocol', { allowedProtocols: formatListWithOr(allowedProtocols, t) });
  } else {
    validateStatus = 'success';
    help = null;
  }

  return { validateStatus, help };
}

export function validateMarkdown(markdown, t) {
  let validateStatus;
  let help;

  if (MARKDOWN_REGEX_BOLD_OR_ITALIC_WITHIN_HEADERS.test(markdown)) {
    validateStatus = 'warning';
    help = t('validation:markdownBoldOrItalicWithinHeaders');
  } else {
    validateStatus = 'success';
    help = null;
  }

  return { validateStatus, help };
}

export default {
  validateUrl,
  validateMarkdown
};
