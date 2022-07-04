import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function RoomExitedIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '60', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M520.5 963.09 91.83 913.43V86.57L520.5 36.91c17.39-2.01 32.68 11.31 32.68 28.49v869.2c-.01 17.18-15.29 30.51-32.68 28.49z" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '60', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M553.17 913.44H741c18.63 0 33.73-15.1 33.73-33.73v-73.1m0-577.24V120.3c0-18.63-15.11-33.73-33.73-33.73H553.17" />
      <path style={{ fill: 'currentColor' }} d="M440.25 453.89c-23.56 0-42.66 22.77-42.66 50.85 0 28.09 19.1 50.85 42.66 50.85 23.56 0 42.66-22.77 42.66-50.85 0-28.08-19.1-50.85-42.66-50.85z" />
      <path style={{ fill: 'currentColor', stroke: 'currentColor', strokeWidth: '60', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M774.73 647.39v81.08" />
      <path style={{ fill: 'currentColor' }} d="m926.88 446.92-147.84 122.8c-9.13 7.59-22.97 1.09-22.97-10.78V313.33c0-11.87 13.84-18.37 22.97-10.78l147.84 122.81c6.74 5.6 6.74 15.95 0 21.56z" transform="matrix(1 0 0 .83278 24 72.932)" />
      <path style={{ fill: 'currentColor' }} d="M638.52 501.91h144.64c9.25 0 16.75-7.5 16.75-16.75v-98.05c0-9.25-7.5-16.75-16.75-16.75H638.52c-9.25 0-16.75 7.5-16.75 16.75v98.05c0 9.25 7.5 16.75 16.75 16.75z" transform="matrix(1 0 0 .66597 12 147.68)" />
      <ellipse style={{ fill: 'currentColor' }} cx="440.25" cy="504.74" rx="42.66" ry="50.85" />
    </svg>
  );
}

function RoomExitedIcon() {
  return (
    <Icon component={RoomExitedIconComponent} />
  );
}

export default RoomExitedIcon;
