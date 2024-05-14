import React from 'react';
import { Rate } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { StarIcon } from './icons/icons.js';

function StarRating({ value, small, allowHalf, onChange }) {
  const classes = classNames({
    'StarRating': true,
    'StarRating--small': small,
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
  small: PropTypes.bool,
  allowHalf: PropTypes.bool,
  onChange: PropTypes.func
};

StarRating.defaultProps = {
  value: null,
  small: false,
  allowHalf: false,
  onChange: null
};

export default StarRating;
