import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function DocumentsIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '60', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M810.05 298.41v543.24c0 37.72-30.58 68.31-68.31 68.31H258.26c-37.72 0-68.31-30.58-68.31-68.31v-683.3c0-37.72 30.58-68.31 68.31-68.31h352.18l199.61 208.37z" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '60', strokeLinejoin: 'bevel', strokeMiterlimit: '10' }} d="M579.06 80.11v168.22c0 46.19 37.45 83.64 83.65 83.64h157.63" />
    </svg>
  );
}

function DocumentsIcon(props) {
  return (
    <Icon component={DocumentsIconComponent} {...props} />
  );
}

export default DocumentsIcon;
