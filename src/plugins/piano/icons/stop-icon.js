import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function StopIconComponent() {
  return (
    <svg width="1em" height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} viewBox="0 0 1000 1000" >
      <path d="M787.58 847.75H212.42c-33.23 0-60.17-26.94-60.17-60.17V212.42c0-33.23 26.94-60.17 60.17-60.17h575.16c33.23 0 60.17 26.94 60.17 60.17v575.16c0 33.23-26.94 60.17-60.17 60.17z" style={{ fill: '#666' }} />
    </svg>
  );
}

function StopIcon() {
  return (
    <Icon component={StopIconComponent} />
  );
}

export default StopIcon;
