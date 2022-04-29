import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function QuickTesterIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: '#f2f2f2', stroke: '#666', strokeWidth: '40', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M796.15 104.64h-592.3c-79.71 0-144.34 64.61-144.34 144.3V613.7c0 79.69 64.62 144.3 144.34 144.3h455.42c43.87 49.14 121.09 136.11 121.09 136.11L789.99 758h6.16c79.71 0 144.33-64.61 144.33-144.3V248.94c0-79.69-64.62-144.3-144.33-144.3z" />
      <path style={{ fill: 'none', stroke: '#666', strokeWidth: '40', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M664.72 202.52h68.9c61.01 0 110.48 49.45 110.48 110.45m0 62.05v72.18" />
      <path style={{ fill: 'none', stroke: '#666', strokeWidth: '68.0372', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M413.3 369.65c0-37.97 31.05-68.69 69.15-68.16 36.21.5 66.7 30.99 67.2 67.18.31 22.53-8.64 38.41-26.91 55.23-23.21 21.37-41.26 47.63-41.26 79.18v0" />
      <circle style={{ fill: '#666' }} cx="477.03" cy="586.48" r="35.43" />
    </svg>
  );
}

function QuickTesterIcon() {
  return (
    <Icon component={QuickTesterIconComponent} />
  );
}

export default QuickTesterIcon;
