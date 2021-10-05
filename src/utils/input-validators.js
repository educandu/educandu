function isValidPassword({ password, minLength = 8 }) {
  const passwordRegexp = new RegExp(`^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{${minLength},}$`);
  const sanitizedPassword = (password || '').trim();

  return sanitizedPassword.length >= minLength && passwordRegexp.test(sanitizedPassword);
}

export default {
  isValidPassword
};
