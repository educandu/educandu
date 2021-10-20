function isValidPassword({ password, minLength = 8 }) {
  const minOneLetterAndOneDigitPattern = /^(?=.*[A-Za-z])(?=.*\d).*$/;
  const sanitizedPassword = (password || '').trim();

  return sanitizedPassword.length >= minLength && minOneLetterAndOneDigitPattern.test(sanitizedPassword);
}

function isValidTag(allTags, tag) {
  const trimmedTag = (tag || '').trim();

  if (trimmedTag.length < 3 || trimmedTag.length > 30 || (/\s/).test(trimmedTag)) {
    return false;
  }

  if (allTags.filter(t => t === trimmedTag).length > 1) {
    return false;
  }

  return true;
}

export default {
  isValidPassword,
  isValidTag
};
