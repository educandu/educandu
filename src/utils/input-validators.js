import { slugValidationPattern, passwordValidationPattern, minPasswordLength, tagValidationPattern } from '../domain/validation-constants.js';

function isValidPassword(password) {
  const sanitizedPassword = (password || '').trim();
  return sanitizedPassword.length >= minPasswordLength && passwordValidationPattern.test(sanitizedPassword);
}

function isValidTag({ tag, allTags = [] }) {
  const trimmedTag = (tag || '').trim();

  if (!tagValidationPattern.test(trimmedTag)) {
    return false;
  }

  if (allTags.filter(t => t === trimmedTag).length > 1) {
    return false;
  }

  return true;
}

function isValidSlug(slug) {
  return slugValidationPattern.test(slug);
}

export default {
  isValidPassword,
  isValidTag,
  isValidSlug
};
