import React from 'react';
import PropTypes from 'prop-types';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function starIconComponent({ isFilled }) {
  const fill = isFilled ? 'currentColor' : 'none';

  return (
    <svg width="1em" height="1em" viewBox="0 0 1000 1000" style={{ enableBackground: 'new 0 0 1000 1000' }} role="img" >
      <path d="m246.078 697.532 18.72-80.19L55.68 437.192c-28.913-24.905-13.502-72.336 24.529-75.497l275.065-22.821 106.71-254.557c14.753-35.194 64.632-35.194 79.384 0l106.71 254.557 275.065 22.821c38.031 3.16 53.443 50.592 24.53 75.497l-209.117 180.15 63.286 268.664c8.755 37.144-31.589 66.46-64.227 46.665L501.684 789.45 265.739 932.67c-32.625 19.81-72.97-9.507-64.228-46.664l44.567-188.474" style={{ fill, stroke: 'currentColor', strokeWidth: 50, strokeLinecap: 'round', strokeMiterlimit: 10 }} />
    </svg>
  );
}

function StarIcon({ isFilled }) {
  return (
    <Icon component={() => starIconComponent({ isFilled })} />
  );
}

StarIcon.propTypes = {
  isFilled: PropTypes.bool
};

StarIcon.defaultProps = {
  isFilled: false
};

export default StarIcon;
