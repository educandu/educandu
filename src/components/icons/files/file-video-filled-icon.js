import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function FileVideoFilledIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: '#f2f2f2', stroke: 'currentColor', strokeWidth: '20', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M77.44 257.98V224.1c0-45.58 36.95-82.53 82.53-82.53h680.05c45.58 0 82.53 36.95 82.53 82.53v551.8c0 45.58-36.95 82.53-82.53 82.53H159.98c-45.58 0-82.53-36.95-82.53-82.53V529.35m-.01-136.51v-57.75" />
      <path style={{ fill: 'currentColor' }} d="M608.66 478.3 426.32 348c-19.91-14.23-47.58 0-47.58 24.48v260.6c0 24.47 27.66 38.71 47.58 24.48l182.34-130.3c16.79-12 16.79-36.96 0-48.96z" />
    </svg>
  );
}

function FileVideoFilledIcon() {
  return (
    <Icon component={FileVideoFilledIconComponent} />
  );
}

export default FileVideoFilledIcon;
