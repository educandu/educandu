import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function FileUnknownIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '45', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M859.09 287.84v607.84c0 43.69-35.42 79.11-79.11 79.11H220.02c-43.69 0-79.11-35.42-79.11-79.11V104.32c0-43.69 35.42-79.11 79.11-79.11h385.24c14.46 0 28.3 5.91 38.3 16.35l200.78 209.59a52.995 52.995 0 0 1 14.75 36.69z" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '45', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M598.16 44.47V210.8c0 45.67 37.03 82.7 82.71 82.7h155.85" />
    </svg>
  );
}

function FileUnknownIcon() {
  return (
    <Icon component={FileUnknownIconComponent} />
  );
}

export default FileUnknownIcon;
