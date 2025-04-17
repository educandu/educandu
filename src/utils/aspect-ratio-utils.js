export function getHeightForAspectRatio(width, aspectRatio) {
  const [a, b] = aspectRatio.split(':');
  const divisor = Number.parseInt(a, 10) / Number.parseInt(b, 10);
  return Math.round(width / divisor);
}
