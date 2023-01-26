import urlUtils from '../utils/url-utils.js';

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

export const validateUrl = ({ url, allowEmpty, allowMailto, t }) => {
  if (!url && allowEmpty) {
    return { validateStatus: 'success', help: null };
  }

  if ((url || '').startsWith('mailto') && !allowMailto) {
    return { validateStatus: 'error', help: t('validation:urlInvalid') };
  }

  return urlUtils.isValidUrl(url)
    ? { validateStatus: 'success', help: null }
    : { validateStatus: 'error', help: t('validation:urlInvalid') };
};

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
