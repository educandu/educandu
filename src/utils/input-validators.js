import { slugValidationPattern, passwordValidationPattern, minUserPasswordLength, documentTagValidationPattern, emailValidationPattern } from '../domain/validation-constants.js';

function isValidPassword(password) {
  const sanitizedPassword = (password || '').trim();
  return sanitizedPassword.length >= minUserPasswordLength && passwordValidationPattern.test(sanitizedPassword);
}

function isValidTag({ tag, allTags = [] }) {
  const trimmedTag = (tag || '').trim();

  if (!documentTagValidationPattern.test(trimmedTag)) {
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

function isValidEmail(email) {
  return emailValidationPattern.test(email);
}

export default {
  isValidPassword,
  isValidTag,
  isValidSlug,
  isValidEmail
};
