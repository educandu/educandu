import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function AlertIconComponent() {
  return (
    <svg height="1.2em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1.2em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'none' }} d="M933.66 500c0 239.51-194.16 433.66-433.66 433.66S66.34 739.51 66.34 500 260.49 66.34 500 66.34c71.97 0 139.85 17.53 199.6 48.56 75.74 39.34 138.41 100.37 179.78 174.86 34.59 62.27 54.28 133.95 54.28 210.24z" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '40', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M928.21 431c3.59 22.47 5.46 45.52 5.46 69 0 239.51-194.16 433.66-433.66 433.66S66.34 739.51 66.34 500 260.49 66.34 500 66.34c71.97 0 139.85 17.53 199.6 48.56m125.06 97.59c20.92 23.6 39.3 49.5 54.72 77.27a431.007 431.007 0 0 1 25.94 55.71" />
      <path style={{ fill: 'currentColor' }} d="M437.87 772.75h1.77l.18-2.64zm88.91-295.36 75.94-191.9c3.84-9.69-3.31-20.21-13.73-20.21h-140.3c-7.69 0-14.09 5.9-14.72 13.56l-21.79 265.82c-.71 8.6 6.09 15.98 14.72 15.98h47.36l-27.32 166.13c-1.61 9.77 11.32 14.76 16.69 6.43l150.38-233.04c6.34-9.83-.71-22.78-12.41-22.78h-74.82z" />
    </svg>
  );
}

function AlertIcon(props) {
  return (
    <Icon component={AlertIconComponent} {...props} />
  );
}

export default AlertIcon;
