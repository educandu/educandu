/* eslint-disable no-mixed-operators */
function hexToRgb(hex) {
  const result = (/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i).exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}

// Algorithm followed: https://alienryderflex.com/hsp.html
export function getContrastColor(hex, threshold = 0.6) {
  const rgb = hexToRgb(hex);
  const percievedRed = 0.299;
  const percievedGreen = 0.587;
  const percievedBlue = 0.114;

  const redQuota = percievedRed * ((rgb[0] / 255) ** 2);
  const greenQuota = percievedGreen * ((rgb[1] / 255) ** 2);
  const blueQuote = percievedBlue * ((rgb[2] / 255) ** 2);

  const contrast = Math.sqrt(redQuota + greenQuota + blueQuote);

  return contrast > threshold ? '#000000' : '#ffffff';
}
