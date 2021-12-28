const slugValidationPattern = /^[a-z0-9-]+(\/[a-z0-9-]+)*$/;

function isValidPassword({ password, minLength = 8 }) {
  const minOneLetterAndOneDigitPattern = /^(?=.*[A-Za-z])(?=.*\d).*$/;
  const sanitizedPassword = (password || '').trim();

  return sanitizedPassword.length >= minLength && minOneLetterAndOneDigitPattern.test(sanitizedPassword);
}

function isValidTag({ tag, allTags = [] }) {
  const trimmedTag = (tag || '').trim();

  if (trimmedTag.length < 3 || trimmedTag.length > 30 || (/\s/).test(trimmedTag)) {
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
  isValidSlug,
  slugValidationPattern
};
