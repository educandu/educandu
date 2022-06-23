import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function PlayIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'currentColor' }} d="M779.89 440.06 302 113.63c-48.18-32.91-113.53 1.59-113.53 59.94v652.87c0 58.35 65.35 92.85 113.53 59.94l477.89-326.43c42.19-28.83 42.19-91.07 0-119.89z" />
    </svg>
  );
}

function PlayIcon(props) {
  return (
    <Icon component={PlayIconComponent} {...props} />
  );
}

export default PlayIcon;
