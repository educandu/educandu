import React from 'react';
import iconNs, { LineOutlined } from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function IframeIconComponent() {
  return (
    <LineOutlined />
  );
}

function IframeIcon() {
  return (
    <Icon component={IframeIconComponent} />
  );
}

export default IframeIcon;
