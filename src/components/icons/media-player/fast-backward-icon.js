import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function FastBackwardIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ strokeWidth: '.7', fill: 'currentColor' }} d="m531.72 448.5 347.49-237.36c35.034-23.93 82.552 1.157 82.552 43.585V729.45c0 42.428-47.518 67.514-82.552 43.584L531.72 535.676c-30.678-20.964-30.678-66.22 0-87.177z" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '76.5924', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '4', strokeDasharray: 'none', strokeOpacity: '1' }} d="M682.211 237.004 330.063 496.466l361.33 256.542" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '76.5924', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '4', strokeDasharray: 'none', strokeOpacity: '1' }} d="M464.566 237.568 112.418 497.03l361.33 256.542" />
    </svg>
  );
}

function FastBackwardIcon() {
  return (
    <Icon component={FastBackwardIconComponent} />
  );
}

export default FastBackwardIcon;
