import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function FileUnknownFilledIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: '#f2f2f2', stroke: 'currentColor', strokeWidth: '20', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M138.72 363.74V101.9c0-43.96 35.63-79.59 79.59-79.59H605.9c14.55 0 28.47 5.94 38.54 16.45l202.01 210.87a53.346 53.346 0 0 1 14.83 36.92V898.1c0 43.96-35.63 79.59-79.59 79.59H218.31c-43.96 0-79.59-35.63-79.59-79.59V521.3" />
      <path style={{ fill: '#fff', stroke: 'currentColor', strokeWidth: '20', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M861.28 292.23v-5.69c0-13.76-5.31-26.98-14.83-36.92L644.44 38.76a53.373 53.373 0 0 0-38.54-16.45h-7.14v186.72c0 45.95 37.26 83.2 83.21 83.2h179.31z" />
    </svg>
  );
}

function FileUnknownFilledIcon() {
  return (
    <Icon component={FileUnknownFilledIconComponent} />
  );
}

export default FileUnknownFilledIcon;
