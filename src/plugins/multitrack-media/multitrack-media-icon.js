import React from 'react';
import iconNs, { QuestionOutlined } from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function MultitrackMediaIconComponent() {
  return <QuestionOutlined />;
}

function MultitrackMediaIcon() {
  return (
    <Icon component={MultitrackMediaIconComponent} />
  );
}

export default MultitrackMediaIcon;
