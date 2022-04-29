import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function WarningIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: '#f2f2f2', stroke: 'currentColor', strokeWidth: '40', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="m591.89 183.2-36.38-62.87c-24.67-42.73-86.35-42.73-111.02 0L43.09 815.57c-24.67 42.73 6.17 96.15 55.51 96.15h802.8c49.34 0 80.18-53.42 55.51-96.15L705.8 382.52m-30.87-56.79-27.01-44.5" />
      <path style={{ fill: 'currentColor' }} d="M500 692.93c24.74 0 45.04 18.39 45.04 43.13s-20.3 42.5-45.04 42.5c-24.11 0-45.04-17.76-45.04-42.5s20.93-43.13 45.04-43.13zm-.63-340.29c18.39 0 33.61 15.85 33.61 34.24l-8.23 243.88c0 14.58-11.43 27.28-26.01 27.28s-26.01-12.7-26.01-27.28l-8.23-243.88c0-18.39 15.22-34.24 33.61-34.24h1.26z" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <Icon component={WarningIconComponent} />
  );
}

export default WarningIcon;
