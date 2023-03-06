import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function StandardSolutionIconComponent() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 1000 1000" style={{ enableBackground: 'new 0 0 1000 1000' }} role="img" >
      <path d="M795.7 974.4c-5.6 0-11.1-2.4-15-6.7-.9-1-82.7-93.2-133.4-150H162.6C73 817.7 0 744.8 0 655.1V188.2C0 98.5 73 25.6 162.6 25.6h674.8c89.7 0 162.6 73 162.6 162.6v466.9c0 89.7-73 162.6-162.6 162.6h-11.9l-9.8 138.1c-.6 8-5.9 14.9-13.5 17.5-2.2.8-4.3 1.1-6.5 1.1zM162.6 65.6C95 65.6 40 120.6 40 188.2v466.9c0 67.6 55 122.6 122.6 122.6h493.7c5.7 0 11.1 2.4 14.9 6.7 31.1 34.9 77.3 86.8 107.8 121.2l7.7-109.3c.7-10.5 9.5-18.6 20-18.6h30.6c67.6 0 122.6-55 122.6-122.6V188.2c0-67.6-55-122.6-122.6-122.6H162.6z" style={{ fill: 'currentColor' }} />
      <path d="M869.1 509.2c-11 0-20-9-20-20v-58.1c0-11 9-20 20-20s20 9 20 20v58.1c0 11-9 20-20 20z" style={{ fill: 'currentColor' }} />
      <circle cx={493} cy={622.6} r={40.6} style={{ fill: 'currentColor' }} />
      <path d="M493 228.8c-29.1 0-52 26.5-49.9 57.6L458.4 510c.6 20 15.9 35.9 34.5 35.9 18.7 0 33.9-15.9 34.5-35.9l15.3-223.6c2.3-31.2-20.6-57.6-49.7-57.6zm373.8 151.9c-11 0-20-9-20-20v-99.5c0-38.2-31.1-69.2-69.2-69.2h-57.4c-11 0-20-9-20-20s9-20 20-20h57.4c60.2 0 109.2 49 109.2 109.2v99.5c0 11-9 20-20 20z" style={{ fill: 'currentColor' }} />
    </svg>
  );
}

function StandardSolutionIcon() {
  return (
    <Icon component={StandardSolutionIconComponent} />
  );
}

export default StandardSolutionIcon;
