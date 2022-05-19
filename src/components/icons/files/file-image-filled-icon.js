import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function FileImageFilledIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: '#f2f2f2', stroke: 'currentColor', strokeWidth: '20', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M77.44 257.98V224.1c0-45.58 36.95-82.53 82.53-82.53h680.05c45.58 0 82.53 36.95 82.53 82.53v551.8c0 45.58-36.95 82.53-82.53 82.53H159.98c-45.58 0-82.53-36.95-82.53-82.53V529.35m-.01-136.51v-57.75" />
      <path style={{ fill: 'currentColor' }} d="M617.04 461.8 389.69 779.94c-20.84 29.16.01 69.68 35.85 69.68h454.69c35.84 0 56.69-40.52 35.85-69.68L688.74 461.8c-17.57-24.6-54.13-24.6-71.7 0z" />
      <path style={{ fill: 'currentColor' }} d="M268.75 580.95 104.4 781.45c-23.58 28.76-3.12 72 34.08 72h328.71c37.19 0 57.66-43.24 34.08-72l-164.36-200.5c-17.63-21.51-50.53-21.51-68.16 0z" />
      <circle style={{ fill: 'currentColor' }} cx="447.62" cy="386.1" r="77.79" />
    </svg>
  );
}

function FileImageFilledIcon() {
  return (
    <Icon component={FileImageFilledIconComponent} />
  );
}

export default FileImageFilledIcon;
