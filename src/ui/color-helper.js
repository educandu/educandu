const color = require('color');

function getContrastColor(col) {
  return color(col).isLight() ? '#000' : '#FFF';
}

module.exports = {
  getContrastColor
};
