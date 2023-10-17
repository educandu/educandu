import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

// SVG is taken and adapted from: https://tabler-icons.io/i/file-upload (MIT licensed - Copyright (c) 2020-2023 Paweł Kuna)

export function FileUploadFieldIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 24 24' }} width="1em" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
      <path d="M12 11v6" />
      <path d="M9.5 13.5l2.5 -2.5l2.5 2.5" />
    </svg>
  );
}

function FileUploadFieldIcon() {
  return (
    <Icon component={FileUploadFieldIconComponent} />
  );
}

export default FileUploadFieldIcon;
