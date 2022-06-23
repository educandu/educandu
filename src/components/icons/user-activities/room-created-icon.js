import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function RoomCreatedIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '60', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M499.59 963.09 70.92 913.43V86.57l428.67-49.66c17.39-2.01 32.68 11.31 32.68 28.49v869.2c0 17.18-15.29 30.51-32.68 28.49z" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '60', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M532.26 913.44h187.83c18.63 0 33.73-15.1 33.73-33.73v-73.1m0-634.29V120.3c0-18.63-15.11-33.73-33.73-33.73H532.26" />
      <path style={{ fill: 'currentColor' }} d="M419.34 459.09c-23.56 0-42.66 22.77-42.66 50.85 0 28.09 19.1 50.85 42.66 50.85 23.56 0 42.66-22.77 42.66-50.85 0-28.09-19.1-50.85-42.66-50.85z" />
      <path style={{ fill: 'currentColor', stroke: 'currentColor', strokeWidth: '60', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M753.82 637.06v106.46" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '81.1986', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M794.99 277.18v234.51m117.26-117.26H677.73" />
      <ellipse style={{ fill: 'currentColor' }} cx="419.34" cy="509.94" rx="42.66" ry="50.85" />
    </svg>
  );
}

function RoomCreatedIcon(props) {
  return (
    <Icon component={RoomCreatedIconComponent} {...props} />
  );
}

export default RoomCreatedIcon;
