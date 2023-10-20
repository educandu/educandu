import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

// SVG is taken and adapted from: https://tabler-icons.io/i/trash-x (MIT licensed - Copyright (c) 2020-2023 Paweł Kuna)

export function ClearIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 24 24' }} width="1em" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M4 7h16" />
      <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
      <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
      <path d="M10 12l4 4m0 -4l-4 4" />
    </svg>
  );
}

function ClearIcon(props) {
  return (
    <Icon component={ClearIconComponent} {...props} />
  );
}

export default ClearIcon;
