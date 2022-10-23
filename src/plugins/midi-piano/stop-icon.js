import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function StopIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path
        style={{ fill: '#666666' }}
        d="M787.58,847.75H212.42c-33.23,0-60.17-26.94-60.17-60.17V212.42c0-33.23,26.94-60.17,60.17-60.17h575.16
        c33.23,0,60.17,26.94,60.17,60.17v575.16C847.75,820.81,820.81,847.75,787.58,847.75z"
        />
    </svg>
  );
}

function StopIcon() {
  return (
    <Icon component={StopIconComponent} />
  );
}

export default StopIcon;
