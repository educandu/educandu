import color from 'color';

export function getContrastColor(col) {
  return color(col).isLight() ? '#000' : '#FFF';
}

export default {
  getContrastColor
};
