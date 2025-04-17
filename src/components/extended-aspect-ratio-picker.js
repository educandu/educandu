import { Slider } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import { EXTENDED_ASPECT_RATIO } from '../domain/constants.js';
import { getHeightForAspectRatio } from '../utils/aspect-ratio-utils.js';

const allValues = Object.values(EXTENDED_ASPECT_RATIO);
const allValuesIndexByValueMap = new Map(allValues.map((value, index) => [value, index]));

function ExtendedAspectRatioPicker({ value, onChange, ...sliderProps }) {
  const sliderMarks = useMemo(() => {
    return Object.fromEntries(allValues.map((val, index) => {
      const isFirstOrLast = index === 0 || index === allValues.length - 1;
      const isSpecial = val === EXTENDED_ASPECT_RATIO.sixteenToNine || val === EXTENDED_ASPECT_RATIO.fourToThree;
      const classes = classNames({
        'ExtendedAspectRatioPicker-mark': true,
        'ExtendedAspectRatioPicker-mark--special': isSpecial,
        'ExtendedAspectRatioPicker-mark--firstOrLast': isFirstOrLast
      });

      return [index, <span key={index} className={classes}>{val}</span>];
    }));
  }, []);

  const sliderTooltipFormatter = index => {
    const val = allValues[index];
    const width = 100;
    const height = getHeightForAspectRatio(width, val);

    return (
      <div className="ExtendedAspectRatioPicker-toolTip">
        <div className="ExtendedAspectRatioPicker-toolTipExampleBox">
          <div
            style={{ width: `${width}%`, height: `${height}%` }}
            className="ExtendedAspectRatioPicker-toolTipExample"
            />
        </div>
        <div className="ExtendedAspectRatioPicker-toolTipLabel">{val}</div>
      </div>
    );
  };

  const handleValueInfoIndexChange = newIndex => {
    onChange(allValues[newIndex]);
  };

  return (
    <Slider
      {...sliderProps}
      step={null}
      marks={sliderMarks}
      value={allValuesIndexByValueMap.get(value)}
      min={0}
      max={allValues.length - 1}
      className="ExtendedAspectRatioPicker"
      tooltip={{ formatter: sliderTooltipFormatter }}
      onChange={handleValueInfoIndexChange}
      />
  );
}

ExtendedAspectRatioPicker.propTypes = {
  value: PropTypes.oneOf(Object.values(EXTENDED_ASPECT_RATIO)),
  onChange: PropTypes.func
};

ExtendedAspectRatioPicker.defaultProps = {
  value: EXTENDED_ASPECT_RATIO.sixteenToNine,
  onChange: () => {}
};

export default ExtendedAspectRatioPicker;
