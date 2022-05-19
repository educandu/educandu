import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function FilePdfIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '45', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M859.09 287.84v607.84c0 43.69-35.42 79.11-79.11 79.11H220.02c-43.69 0-79.11-35.42-79.11-79.11V104.32c0-43.69 35.42-79.11 79.11-79.11h385.24c14.46 0 28.3 5.91 38.3 16.35l200.78 209.59a52.995 52.995 0 0 1 14.75 36.69z" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '45', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M598.16 44.47V210.8c0 45.67 37.03 82.7 82.71 82.7h155.85" />
      <g style={{ strokeWidth: '10', strokeMiterlimit: '10', strokeDasharray: 'none' }}>
        <path style={{ strokeWidth: '10', strokeMiterlimit: '10', strokeDasharray: 'none', fill: 'currentColor' }} d="M270.12 689.83c.26-10.67 6.75-19.51 18.21-19.51h55.13c40.85 0 59.04 29.39 59.04 58.78 0 29.65-18.19 58.53-59.04 58.53h-35.37v45.51c0 9.62-8.57 17.69-18.98 17.69-9.88 0-18.98-8.33-18.98-17.69V689.83Zm37.96 14.04v50.47h33.55c14.84 0 22.64-13.54 22.64-25.23 0-11.18-7.28-25.23-21.59-25.23h-34.6zm142.29 145.65c-9.62 0-15.08-7.54-15.08-16.13V686.45c.26-8.85 5.46-16.13 15.08-16.13h55.14c51.5 0 80.89 39.01 80.89 90 0 50.71-29.39 89.21-80.89 89.21h-55.14zm22.9-33.29h32.24c28.62 0 42.91-26.52 42.91-55.92 0-29.65-14.29-56.45-42.91-56.45h-32.24zm247.61-145.91c8.57 0 15.6 7.54 15.6 16.9 0 8.59-7.28 16.39-15.6 16.65h-59.57v41.09h44.22c8.59 0 15.61 7.28 15.61 16.39 0 8.59-7.28 16.39-15.61 16.39h-44.22v55.4c0 9.62-8.57 17.69-18.98 17.69-9.88 0-18.98-8.33-18.98-17.69V686.45c.26-8.85 5.46-16.13 15.08-16.13z" transform="matrix(1.09887 0 0 1.2315 -52.707 -176.96)" />
      </g>
    </svg>
  );
}

function FilePdfIcon() {
  return (
    <Icon component={FilePdfIconComponent} />
  );
}

export default FilePdfIcon;
