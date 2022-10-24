import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function HelpIconComponent() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 1000 1000" style={{ enableBackground: 'new 0 0 1000 1000' }} role="img" >
      <path d="M324.1 338.76c0-97.98 80.11-177.25 178.41-175.88 93.42 1.3 172.08 79.96 173.38 173.38.81 58.15-22.28 99.13-69.42 142.54C546.58 533.95 500 601.72 500 683.13v0" style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 55, strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: 10 }} />
      <circle cx={502.35} cy={827.02} r={40} style={{ fill: 'currentColor' }} />
    </svg>
  );
}

function HelpIcon() {
  return (
    <Icon component={HelpIconComponent} />
  );
}

export default HelpIcon;
