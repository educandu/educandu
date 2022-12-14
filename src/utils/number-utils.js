export function getNumberFromString(string) {
  const digits = string.replace(/\D/g, '');

  if (digits) {
    return Number(digits);
  }

  return null;
}
