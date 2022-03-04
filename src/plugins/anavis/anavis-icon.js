import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function AnavisIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: '#666' }} d="M611.37 711.64 389.91 585.03a1.29 1.29 0 0 0-1.93 1.12v253.22c0 .99 1.07 1.61 1.93 1.12l221.45-126.61c.87-.5.87-1.75.01-2.24z" />
      <path style={{ fill: '#f2f2f2', stroke: '#666', strokeWidth: '40', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M976.24 462.37H23.76a3.26 3.26 0 0 1-3.26-3.26V269.49c0-1.8 1.46-3.26 3.26-3.26h952.47c1.8 0 3.26 1.46 3.26 3.26v189.62c.01 1.8-1.45 3.26-3.25 3.26zM187.19 266.91V460.3m235.74-193.39V460.3m94.86-193.39V460.3m236.43-193.39V460.3" />
    </svg>
  );
}

function AnavisIcon() {
  return (
    <Icon component={AnavisIconComponent} />
  );
}

export default AnavisIcon;
