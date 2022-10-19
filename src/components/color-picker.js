import React from 'react';
import { Dropdown } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import SwatchesPickerNs from 'react-color/lib/Swatches.js';
import { DEFAULT_COLOR_SWATCHES } from '../domain/constants.js';

const SwatchesPicker = SwatchesPickerNs.default || SwatchesPickerNs;

function ColorPicker({ color, colors, onChange, placement, width, inline }) {
  const picker = (
    <SwatchesPicker
      width={width}
      colors={colors}
      color={color}
      onChange={({ hex }) => onChange(hex)}
      />
  );

  const pickerClasses = classNames({
    'ColorPicker': true,
    'ColorPicker--inline': inline
  });

  const currentColorClasses = classNames({
    'ColorPicker-currentColor': true,
    'ColorPicker-currentColor--inline': inline
  });

  return (
    <div className={pickerClasses}>
      <Dropdown overlay={picker} placement={placement}>
        <div className={currentColorClasses} style={{ backgroundColor: color }} />
      </Dropdown>
    </div>
  );
}

ColorPicker.propTypes = {
  color: PropTypes.string,
  colors: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string.isRequired).isRequired),
  inline: PropTypes.bool,
  onChange: PropTypes.func,
  placement: PropTypes.oneOf(['bottomLeft', 'bottomCenter', 'bottomRight', 'topLeft', 'topCenter', 'topRight']),
  width: PropTypes.number
};

ColorPicker.defaultProps = {
  color: null,
  colors: DEFAULT_COLOR_SWATCHES,
  inline: false,
  onChange: () => {},
  placement: 'bottomLeft',
  width: 382
};

export default ColorPicker;
