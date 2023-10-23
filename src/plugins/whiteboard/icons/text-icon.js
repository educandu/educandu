import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

// SVG is taken and adapted from: https://tabler-icons.io/i/typography (MIT licensed - Copyright (c) 2020-2023 Paweł Kuna)

export function TextIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 24 24' }} width="1em" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M4 20l3 0" />
      <path d="M14 20l7 0" />
      <path d="M6.9 15l6.9 0" />
      <path d="M10.2 6.3l5.8 13.7" />
      <path d="M5 20l6 -16l2 0l7 16" />
    </svg>
  );
}

function TextIcon(props) {
  return (
    <Icon component={TextIconComponent} {...props} />
  );
}

export default TextIcon;
