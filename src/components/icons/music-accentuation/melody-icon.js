import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function MelodyIconComponent() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 1000 1000" style={{ enableBackground: 'new 0 0 1000 1000' }} role="img" >
      <path d="M468.5 1000c-42.9 0-84-8-120-23.6-27.8-12.1-51.1-28.1-69.4-47.7-19.4-20.8-32.1-44.7-37.7-70.9-8.6-40.1.2-81.6 25.5-120.2 18.6-28.3 45.8-54.1 78.7-74.7 33.5-20.9 73.1-36.3 114.4-44.6 67.8-13.6 135.8-7.8 191.5 16.4 27.8 12.1 51.1 28.1 69.4 47.7 19.4 20.8 32.1 44.7 37.7 70.9 8.6 40.1-.2 81.6-25.5 120.2-18.6 28.3-45.8 54.1-78.7 74.7-33.5 20.9-73.1 36.3-114.4 44.6-24 4.8-48 7.2-71.5 7.2zm63.1-348.9c-20.9 0-42.3 2.1-63.7 6.5-72.6 14.6-135.2 52.7-167.5 102-19.3 29.4-26.1 60.5-19.8 89.9 8.2 38.3 38.1 70.4 83.9 90.3 48.2 21 107.8 25.9 167.7 13.9 72.6-14.6 135.2-52.7 167.5-102 19.3-29.4 26.1-60.5 19.8-89.9-8.2-38.3-38.1-70.4-83.9-90.3-31-13.6-66.6-20.4-104-20.4z" style={{ fill: 'currentColor' }} />
      <path d="M741.8 812.6c-11 0-20-9-20-20V20c0-11 9-20 20-20s20 9 20 20v772.6c0 11.1-9 20-20 20z" style={{ fill: 'currentColor' }} />
    </svg>
  );
}

function MelodyIcon() {
  return (
    <Icon component={MelodyIconComponent} />
  );
}

export default MelodyIcon;