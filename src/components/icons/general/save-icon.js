import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function SaveIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '40', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M778.06 967.98H221.94c-52.84 0-95.67-45.44-95.67-101.5v-736.4c0-56.06 42.83-101.5 95.67-101.5h402.63l249.15 272.47v565.43c.01 56.06-42.83 101.5-95.66 101.5z" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '40', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M718.09 959.85V657.47H281.91v302.38m5.88-928.69v249.71M424.43 31.16v249.71M561.07 31.16v249.71" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <Icon component={SaveIconComponent} />
  );
}

export default SaveIcon;
