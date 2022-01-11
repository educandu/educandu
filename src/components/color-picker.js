import React from 'react';
import { Dropdown } from 'antd';
import PropTypes from 'prop-types';
import SwatchesPicker from 'react-color/lib/Swatches.js';

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

export default ColorPicker;
