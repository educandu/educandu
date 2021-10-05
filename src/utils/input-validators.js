function isValidPassword({ password, minLength = 8 }) {
  const minOneLetterAndOneDigitPattern = /^(?=.*[A-Za-z])(?=.*\d).*$/;
  const sanitizedPassword = (password || '').trim();

  return sanitizedPassword.length >= minLength && minOneLetterAndOneDigitPattern.test(sanitizedPassword);
}

export default {
  isValidPassword
};
