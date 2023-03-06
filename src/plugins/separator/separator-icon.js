import React from 'react';
import iconNs, { LineOutlined } from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function SeparatorIconComponent() {
  return (
    <LineOutlined />
  );
}

function SeparatorIcon() {
  return (
    <Icon component={SeparatorIconComponent} />
  );
}

export default SeparatorIcon;
