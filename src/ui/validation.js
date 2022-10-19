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

export const URL_VALIDATION_STATUS = {
  valid: 'valid',
  empty: 'empty',
  invalidFormat: 'invalid-format',
  invalidProtocol: 'invalid-protocol'
};

function getAllowedProtocols({ allowHttp, allowMailto } = {}) {
  const allowedProtocols = ['https'];
  if (allowHttp) {
    allowedProtocols.push('http');
  }
  if (allowMailto) {
    allowedProtocols.push('mailto');
  }
  return allowedProtocols;
}

export function getUrlValidationStatus(url, { allowEmpty, allowHttp, allowMailto } = {}) {
  const protocol = (url || '').split(':')[0] || '';

  const allowedProtocols = getAllowedProtocols({ allowHttp, allowMailto });

  if (!url) {
    return allowEmpty ? URL_VALIDATION_STATUS.valid : URL_VALIDATION_STATUS.empty;
  }

  if (!URL_REGEX.test(url)) {
    return URL_VALIDATION_STATUS.invalidFormat;
  }

  if (!allowedProtocols.includes(protocol)) {
    return URL_VALIDATION_STATUS.invalidProtocol;
  }

  return URL_VALIDATION_STATUS.valid;
}

export function validateUrl(url, t, { allowEmpty, allowHttp, allowMailto } = {}) {
  const validationStatus = getUrlValidationStatus(url, { allowEmpty, allowHttp, allowMailto });
  switch (validationStatus) {
    case URL_VALIDATION_STATUS.empty:
      return { validateStatus: 'warning', help: t('validation:urlRequired') };
    case URL_VALIDATION_STATUS.invalidFormat:
      return { validateStatus: 'error', help: t('validation:urlInvalid') };
    case URL_VALIDATION_STATUS.invalidProtocol:
    {
      const allowedProtocols = getAllowedProtocols({ allowHttp, allowMailto });
      return { validateStatus: 'error', help: t('validation:urlInvalidProtocol', { allowedProtocols: formatListWithOr(allowedProtocols, t) }) };
    }
    default:
      return { validateStatus: 'success', help: null };
  }
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
