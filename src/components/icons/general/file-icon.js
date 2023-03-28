import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function FileIconComponent() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 1000 1000" style={{ enableBackground: 'new 0 0 1000 1000' }}>
      <path d="M770.97 323.83v474.76c0 32.97-26.73 59.7-59.7 59.7H288.73c-32.97 0-59.7-26.73-59.7-59.7V201.42c0-32.97 26.73-59.7 59.7-59.7h307.78z" style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 50, strokeLinecap: 'round', strokeMiterlimit: 10 }} transform="translate(-121.59 -124.004) scale(1.24278)" />
      <path d="M569.1 133.04v147.01c0 40.37 32.73 73.09 73.1 73.09h137.76" style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 50, strokeLinejoin: 'bevel', strokeMiterlimit: 10 }} transform="translate(-121.59 -124.004) scale(1.24278)" />
    </svg>
  );
}

function FileIcon(props) {
  return (
    <Icon component={FileIconComponent} {...props} />
  );
}

export default FileIcon;
