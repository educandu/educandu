import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function LineIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 24 24' }} width="1em" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12l16 0" />
    </svg>
  );
}

function LineIcon(props) {
  return (
    <Icon component={LineIconComponent} {...props} />
  );
}

export default LineIcon;
