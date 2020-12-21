const React = require('react');
const { Dropdown } = require('antd');
const PropTypes = require('prop-types');
const { SwatchesPicker } = require('react-color');

function ColorPicker({ color, colors, onChange, placement, width }) {
  const picker = (
    <SwatchesPicker
      width={width}
      colors={colors}
      color={color}
      onChange={({ hex }) => onChange && onChange(hex)}
      />
  );

  return (
    <div className="ColorPicker">
      <Dropdown overlay={picker} placement={placement}>
        <div className="ColorPicker-currentColor" style={{ backgroundColor: color }} />
      </Dropdown>
    </div>
  );
}

ColorPicker.propTypes = {
  color: PropTypes.string,
  colors: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string.isRequired).isRequired),
  onChange: PropTypes.func,
  placement: PropTypes.oneOf(['bottomLeft', 'bottomCenter', 'bottomRight', 'topLeft', 'topCenter', 'topRight']),
  width: PropTypes.number
};

ColorPicker.defaultProps = {
  color: null,
  colors: null,
  onChange: null,
  placement: 'bottomLeft',
  width: 320
};

module.exports = ColorPicker;
