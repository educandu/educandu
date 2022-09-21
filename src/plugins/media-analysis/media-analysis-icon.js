import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function MediaAnalisysIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: '#f2f2f2', stroke: '#666', strokeWidth: '26.519', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M917.86 661.63H82.14c-36.92 0-66.84-30.48-66.84-68.09V114.62c0-37.6 29.93-68.09 66.84-68.09h835.73c36.92 0 66.84 30.48 66.84 68.09v478.92c0 37.61-29.93 68.09-66.85 68.09z" />
      <path style={{ fill: '#666' }} d="m574.17 332.37-133.6-78.57c-9.83-5.78-22.11 1.44-22.11 13v157.14c0 11.56 12.28 18.78 22.11 13l133.6-78.57c9.83-5.78 9.83-20.22 0-26z" />
      <path style={{ fill: '#f2f2f2', stroke: '#666', strokeWidth: '26.519', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M941.08 951.27H58.92c-22.99 0-41.63-18.98-41.63-42.4v-109.9c0-23.42 18.64-42.4 41.63-42.4h882.15c22.99 0 41.63 18.98 41.63 42.4v109.9c0 23.42-18.63 42.4-41.62 42.4z" />
      <path style={{ fill: '#f2f2f2', stroke: '#666', strokeWidth: '26.519', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M149.09 755.69v193.46m225.65-183.72v193.46m96.28-193.46v193.46m205.59-193.46v193.46m193.56-193.46v193.46" />
    </svg>
  );
}

function MediaAnalisysIcon() {
  return (
    <Icon component={MediaAnalisysIconComponent} />
  );
}

export default MediaAnalisysIcon;
