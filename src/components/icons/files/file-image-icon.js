import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function FileImageIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <circle style={{ fill: 'currentColor' }} cx="447.94" cy="386.79" r="77.32" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '45', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M837.96 856.26H162.04c-45.31 0-82.03-36.73-82.03-82.03V225.78c0-45.31 36.73-82.03 82.03-82.03h675.92c45.31 0 82.03 36.73 82.03 82.03v548.45c0 45.3-36.72 82.03-82.03 82.03z" />
      <path style={{ fill: 'currentColor' }} d="M616.33 462.03 390.36 778.24c-20.71 28.99.01 69.26 35.63 69.26h451.93c35.63 0 56.35-40.27 35.63-69.26L687.6 462.03c-17.47-24.45-53.8-24.45-71.27 0z" />
      <path style={{ fill: 'currentColor' }} d="M270.16 580.46 106.8 779.74c-23.44 28.59-3.1 71.56 33.87 71.56h326.72c36.97 0 57.31-42.97 33.87-71.56L337.9 580.46c-17.52-21.38-50.22-21.38-67.74 0z" />
    </svg>
  );
}

function FileImageIcon() {
  return (
    <Icon component={FileImageIconComponent} />
  );
}

export default FileImageIcon;
