import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function ImportsIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '60', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M944.7 500c0 246.22-199.1 445.82-444.7 445.82S55.3 746.22 55.3 500 254.4 54.18 500 54.18c126.45 0 240.57 52.91 321.54 137.85l-430.8 411.03" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '60', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M661.63 620.13h-251.8c-16.12 0-29.19-13.1-29.19-29.27V338.43" />
    </svg>
  );
}

function ImportsIcon() {
  return (
    <Icon component={ImportsIconComponent} />
  );
}

export default ImportsIcon;
