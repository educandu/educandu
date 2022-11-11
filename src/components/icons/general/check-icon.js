import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function CheckIconComponent() {
  return (
    <svg width="1.2em" height="1.2em" viewBox="0 0 1000 1000" style={{ enableBackground: 'new 0 0 1000 1000' }} role="img" >
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 110, strokeLinecap: 'round', strokeLinejoin: 'round', strokeOpacity: 1, strokeMiterlimit: 4, strokeDasharray: 'none', paintOrder: 'stroke fill markers' }} d="m120.916 521.756 257.07 344.767 479.563-741.708" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <Icon component={CheckIconComponent} />
  );
}

export default CheckIcon;
