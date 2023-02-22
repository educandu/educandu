import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function GamificationIconComponent() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 1000 1000" style={{ enableBackground: 'new 0 0 1000 1000' }} role="img" >
      <path d="M631.5 808.1c-101.9 0-197.2-50.4-254.7-134.7l-9.8-14.3 229.7-159L365.8 343l9.7-14.4c57.4-85.6 153.2-136.8 256.1-136.8 169.9 0 308.1 138.2 308.1 308.1 0 170-138.3 308.2-308.2 308.2zM415.9 667.8c51.7 66.3 131 105.4 215.6 105.4 150.7 0 273.2-122.6 273.2-273.2S782.1 226.8 631.5 226.8c-85.5 0-165.4 39.8-217 107.2l243.9 165.9-242.5 167.9z" style={{ fill: 'currentColor' }} />
      <circle cx={671.7} cy={384.9} r={44.1} style={{ fill: 'currentColor' }} />
      <path d="M249.5 374.6c.2-7.7-5.9-14.1-13.6-14.3-7.6-.2-14.1 5.9-14.3 13.6l-3.5 140.9c-16.7-13.3-39.1-21.2-62.9-22-23.8-.9-46.7 5.3-64.3 17.5-18.9 13-29.7 31.2-30.4 51.2-.7 20 8.8 39 26.7 53.3 16.7 13.3 39.1 21.2 62.9 22 1.5.1 2.9.1 4.4.1 22.3 0 43.4-6.2 60-17.5 18.9-13 29.7-31.2 30.4-51.2v-2.5l4.6-191.1z" style={{ fill: 'currentColor' }} />
    </svg>
  );
}

function GamificationIcon() {
  return (
    <Icon component={GamificationIconComponent} />
  );
}

export default GamificationIcon;
