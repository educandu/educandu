// Copied from: https://urlregex.com/
// eslint-disable-next-line max-len
const URL_REGEX = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www\.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w\-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[.!/\\\w]*))?)/;

const URL_SECURE_PROTO_REGEX = /^https:\/\/.+$/;

export const MARKDOWN_REGEX_BOLD_OR_ITALIC_WITHIN_HEADERS = /^[#]+\s*[_*]+.+[_*]+\s*[#]*\s*$/m;

export function validateUrl(url, t, { allowEmpty = false, allowInsecure = false } = {}) {
  let validateStatus;
  let help;

  if (!url) {
    validateStatus = allowEmpty ? 'success' : 'warning';
    help = allowEmpty ? null : t('validation:urlRequired');
  } else if (!URL_REGEX.test(url)) {
    validateStatus = 'error';
    help = t('validation:urlInvalid');
  } else if (!allowInsecure && !URL_SECURE_PROTO_REGEX.test(url)) {
    validateStatus = 'error';
    help = t('validation:urlInsecure');
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
