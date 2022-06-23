import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function RoomJoinedIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '60', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M520.5 963.09 91.83 913.43V86.57L520.5 36.91c17.39-2.01 32.68 11.31 32.68 28.49v869.2c-.01 17.18-15.29 30.51-32.68 28.49z" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '60', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M553.17 913.44H741c18.63 0 33.73-15.1 33.73-33.73v-73.1m0-577.24V120.3c0-18.63-15.11-33.73-33.73-33.73H553.17" />
      <path style={{ fill: 'currentColor' }} d="M440.25 455.55c-23.56 0-42.66 22.77-42.66 50.85 0 28.09 19.1 50.85 42.66 50.85s42.66-22.77 42.66-50.85c0-28.09-19.1-50.85-42.66-50.85z" />
      <path style={{ fill: 'currentColor', stroke: 'currentColor', strokeWidth: '60', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M774.73 643.05v81.08" />
      <path style={{ fill: 'currentColor' }} d="m626.83 448.58 147.84 122.81c9.13 7.59 22.97 1.09 22.97-10.78V314.99c0-11.87-13.84-18.37-22.97-10.78l-147.84 122.8c-6.74 5.61-6.74 15.96 0 21.57z" />
      <path style={{ fill: 'currentColor' }} d="M915.19 503.57H770.55c-9.25 0-16.75-7.5-16.75-16.75v-98.05c0-9.25 7.5-16.75 16.75-16.75h144.64c9.25 0 16.75 7.5 16.75 16.75v98.05c0 9.25-7.5 16.75-16.75 16.75z" />
      <ellipse style={{ fill: 'currentColor' }} cx="440.25" cy="506.4" rx="42.66" ry="50.85" />
    </svg>
  );
}

function RoomJoinedIcon(props) {
  return (
    <Icon component={RoomJoinedIconComponent} {...props} />
  );
}

export default RoomJoinedIcon;
