import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function PublicIconComponent() {
  return (
    <svg height="1.2em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1.2em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '40', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="m411.325 354.063-1.033-89.173c-.553-47.787 39.607-94.526 96.516-94.526 51.807 0 95.814 19.571 103.12 61.391 1.268 7.24 3.735 7.998 11.552 7.959l92.61-.467c9.308-.047 16.636-7.52 15.838-16.23-9.288-101.13-107.459-163.113-223.12-163.113-121.786 0-214.158 96.286-214.158 204.986l2.066 91.113z" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '40', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M593.77 545.69 475.54 728.55l-63.39-85" transform="matrix(1.33254 0 0 1.3502 -160.78 -219.307)" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '40', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M809.618 668.627v177.595c0 38.61-31.297 69.897-69.897 69.897h-465.24c-38.61 0-69.897-31.297-69.897-69.897v-460.08c0-16.922 13.72-30.63 30.631-30.63h543.762c16.922 0 30.63 13.719 30.63 30.63l.012 282.485" />
    </svg>
  );
}

function PublicIcon() {
  return (
    <Icon component={PublicIconComponent} />
  );
}

export default PublicIcon;
