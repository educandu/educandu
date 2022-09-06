import React from 'react';
import iconNs, { QuestionCircleOutlined } from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function MediaSlideshowIconComponent() {
  return (
    <QuestionCircleOutlined />
  );
}

function MediaSlideshowIcon() {
  return (
    <Icon component={MediaSlideshowIconComponent} />
  );
}

export default MediaSlideshowIcon;
