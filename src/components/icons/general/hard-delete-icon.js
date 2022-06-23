import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function HardDeleteIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '41.6027', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M713.3 933.25H292.72l-86.2-698.3h592.97zM187.39 161.48h625.22M440.46 66.75h119.09v90.67H440.46z" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '125.3478', strokeLinecap: 'square', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="m406.6 454.86 193.83 193.82m0-193.82L406.6 648.68" />
    </svg>
  );
}

function HardDeleteIcon(props) {
  return (
    <Icon component={HardDeleteIconComponent} {...props} />
  );
}

export default HardDeleteIcon;
