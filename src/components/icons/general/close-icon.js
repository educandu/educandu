import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function CloseIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '110', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M1503.08 664.28v686.68m343.36-343.36h-686.68" transform="rotate(-45 388.811 1964.644)" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <Icon component={CloseIconComponent} />
  );
}

export default CloseIcon;
