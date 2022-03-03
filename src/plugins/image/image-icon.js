import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function ImageIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: '#f2f2f2', stroke: '#666', strokeWidth: '40', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M940.76 866.84H59.24c-3.95 0-7.16-3.21-7.16-7.16V179.9c0-3.95 3.21-7.16 7.16-7.16h881.53c3.95 0 7.16 3.21 7.16 7.16v679.78a7.168 7.168 0 0 1-7.17 7.16z" />
      <path style={{ fill: '#666' }} d="M938.1 854.05 691.24 474.33c-16.92-26.03-56.07-26.03-73 0L440.2 748.2 336.91 643.04c-18.39-18.73-49.21-18.73-67.6 0L62.06 854.05H938.1z" />
      <ellipse style={{ fill: '#666' }} cx="405.83" cy="410.28" rx="84.83" ry="85.06" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <Icon component={ImageIconComponent} />
  );
}

export default ImageIcon;
