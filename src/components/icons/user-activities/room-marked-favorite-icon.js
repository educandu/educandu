import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function RoomMarkedFavoriteIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'currentColor' }} d="m794 239.68 35.03 83.55 90.29 7.49c12.48 1.04 17.54 16.6 8.05 24.78l-68.64 59.13 20.78 88.19c2.87 12.19-10.37 21.82-21.08 15.32l-77.45-47.01-77.45 47.01c-10.71 6.5-23.95-3.12-21.08-15.32l20.78-88.19-68.64-59.13c-9.49-8.18-4.43-23.75 8.05-24.78l90.29-7.49 35.03-83.55c4.83-11.55 21.2-11.55 26.04 0z" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '60', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M520.14 963.09 91.47 913.43V86.57l428.67-49.66c17.39-2.01 32.68 11.31 32.68 28.49v869.2c-.01 17.18-15.29 30.51-32.68 28.49z" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '60', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M552.81 913.44h187.83c18.63 0 33.73-15.1 33.73-33.73v-73.1m0-634.29V120.3c0-18.63-15.11-33.73-33.73-33.73H552.81" />
      <path style={{ fill: 'currentColor' }} d="M439.89 459.7c-23.56 0-42.66 22.77-42.66 50.85 0 28.09 19.1 50.85 42.66 50.85s42.66-22.77 42.66-50.85c0-28.08-19.1-50.85-42.66-50.85z" />
      <path style={{ fill: 'currentColor', stroke: 'currentColor', strokeWidth: '60', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M774.37 578.94v149.34" />
      <ellipse style={{ fill: 'currentColor' }} cx="439.89" cy="510.55" rx="42.66" ry="50.85" />
    </svg>
  );
}

function RoomMarkedFavoriteIcon() {
  return (
    <Icon component={RoomMarkedFavoriteIconComponent} />
  );
}

export default RoomMarkedFavoriteIcon;
