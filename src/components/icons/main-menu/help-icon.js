import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function HelpIconComponent() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 1000 1000" style={{ enableBackground: 'new 0 0 1000 1000' }} role="img" >
      <circle cx={500} cy={500} r={461.68} style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 61.31, strokeMiterlimit: 10 }} />
      <path d="M382.37 390.29c0-65.52 53.57-118.53 119.3-117.62 62.47.87 115.07 53.47 115.94 115.94.54 38.89-14.9 66.29-46.42 95.32-40.05 36.88-71.2 82.2-71.2 136.64v0" style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 112.3337, strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: 10 }} />
      <circle cx={501.57} cy={751.41} r={55.83} style={{ fill: 'currentColor' }} />
    </svg>
  );
}

function HelpIcon() {
  return (
    <Icon component={HelpIconComponent} />
  );
}

export default HelpIcon;
