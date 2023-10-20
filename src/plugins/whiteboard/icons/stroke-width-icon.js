import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

// SVG is taken and adapted from: https://tabler-icons.io/i/ruler-3 (MIT licensed - Copyright (c) 2020-2023 Paweł Kuna)

export function StrokeWidthIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 24 24' }} width="1em" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M19.875 8c.621 0 1.125 .512 1.125 1.143v5.714c0 .631 -.504 1.143 -1.125 1.143h-15.875a1 1 0 0 1 -1 -1v-5.857c0 -.631 .504 -1.143 1.125 -1.143h15.75z" />
      <path d="M9 8v2" />
      <path d="M6 8v3" />
      <path d="M12 8v3" />
      <path d="M18 8v3" />
      <path d="M15 8v2" />
    </svg>
  );
}

function StrokeWidthIcon(props) {
  return (
    <Icon component={StrokeWidthIconComponent} {...props} />
  );
}

export default StrokeWidthIcon;
