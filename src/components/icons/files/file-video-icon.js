import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function FileVideoIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '45', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M837.96 856.26H162.04c-45.31 0-82.03-36.73-82.03-82.03V225.78c0-45.31 36.73-82.03 82.03-82.03h675.92c45.31 0 82.03 36.73 82.03 82.03v548.45c0 45.3-36.72 82.03-82.03 82.03z" />
      <path style={{ fill: 'currentColor' }} d="M634.83 475.67 453.59 346.16c-19.79-14.14-47.29 0-47.29 24.33v259.02c0 24.32 27.5 38.47 47.29 24.33l181.24-129.51c16.68-11.93 16.68-36.73 0-48.66z" />
    </svg>
  );
}

function FileVideoIcon() {
  return (
    <Icon component={FileVideoIconComponent} />
  );
}

export default FileVideoIcon;
