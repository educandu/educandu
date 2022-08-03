import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function MultitrackMediaIconComponent() {
  return (
    <div>placeholder</div>
  );
}

function MultitrackMediaIcon() {
  return (
    <Icon component={MultitrackMediaIconComponent} />
  );
}

export default MultitrackMediaIcon;
