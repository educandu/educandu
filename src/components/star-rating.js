import React from 'react';
import { Rate } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { StarIcon } from './icons/icons.js';

function StarRating({ value, compact, allowHalf, onChange }) {
  const classes = classNames({
    'StarRating': true,
    'StarRating--compact': compact,
    'StarRating--interactive': !!onChange
  });
  return (
    <div className={classes}>
      <Rate
        value={value}
        allowClear={false}
        disabled={!onChange}
        allowHalf={allowHalf}
        character={<StarIcon />}
        onChange={onChange}
        />
    </div>
  );
}

StarRating.propTypes = {
  value: PropTypes.number,
  compact: PropTypes.bool,
  allowHalf: PropTypes.bool,
  onChange: PropTypes.func
};

StarRating.defaultProps = {
  value: null,
  compact: false,
  allowHalf: false,
  onChange: null
};

export default StarRating;
