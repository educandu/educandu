import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function FastForwardIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ strokeWidth: '.7', fill: 'currentColor' }} d="m504.166 448.5-347.49-237.36c-35.034-23.93-82.552 1.157-82.552 43.585V729.45c0 42.428 47.518 67.514 82.552 43.584l347.49-237.358c30.678-20.964 30.678-66.22 0-87.177z" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '76.5924', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '4', strokeDasharray: 'none', strokeOpacity: '1' }} d="m353.675 237.004 352.148 259.462-361.33 256.542" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '76.5924', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '4', strokeDasharray: 'none', strokeOpacity: '1' }} d="M571.32 237.568 923.47 497.03 562.14 753.572" />
    </svg>
  );
}

function FastForwardIcon() {
  return (
    <Icon component={FastForwardIconComponent} />
  );
}

export default FastForwardIcon;
