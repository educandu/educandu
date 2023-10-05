import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

// SVG is taken and adapted from: https://tabler-icons.io/i/forms (MIT licensed - Copyright (c) 2020-2023 Paweł Kuna)

export function TextFieldIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 24 24' }} width="1em" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12 3a3 3 0 0 0 -3 3v12a3 3 0 0 0 3 3" />
      <path d="M6 3a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3" />
      <path d="M13 7h7a1 1 0 0 1 1 1v8a1 1 0 0 1 -1 1h-7" />
      <path d="M5 7h-1a1 1 0 0 0 -1 1v8a1 1 0 0 0 1 1h1" />
      <path d="M17 12h.01" />
      <path d="M13 12h.01" />
    </svg>
  );
}

function TextFieldIcon() {
  return (
    <Icon component={TextFieldIconComponent} />
  );
}

export default TextFieldIcon;
