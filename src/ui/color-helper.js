function hexToRgb(hex) {
  const result = (/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i).exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}

const isLight = hex => {
  const rgb = hexToRgb(hex);
  const yiq = ((rgb[0] * 299) + (rgb[1] * 587) + (rgb[2] * 114)) / 1000;
  return yiq >= 128;
};

export function getContrastColor(col) {
  return isLight(col) ? '#000' : '#FFF';
}

export default {
  getContrastColor
};
