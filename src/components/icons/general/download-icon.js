import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function DownloadIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '70', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M853.81 617.95v127.52c0 61.17-44.34 110.76-99.04 110.76H214.19c-54.7 0-99.04-49.59-99.04-110.76V617.95m369.53-474.18v503.51M676.22 461.9 483.78 647.28M292.74 461.9l192.44 185.38" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <Icon component={DownloadIconComponent} />
  );
}

export default DownloadIcon;
