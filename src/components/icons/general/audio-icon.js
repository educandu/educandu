import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function AudioIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ display: 'inline', fill: 'currentColor', strokeWidth: '2' }} d="M504.12 170.814 170.156 383.93H70.293c-20.57 0-37.243 16.674-37.243 37.244v136.81c0 20.57 16.673 37.243 37.243 37.243h99.863L504.12 810.973c32.26 18.533 72.49-4.767 72.49-41.97V212.785c0-37.204-40.23-60.503-72.49-41.97z" />
      <g style={{ display: 'inline' }}>
        <path style={{ strokeWidth: '25', strokeMiterlimit: '10', strokeDasharray: 'none', fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round' }} d="M633.555 501.25h116.677M631.55 399.72l110.545-52.557" transform="translate(-531.257 -498.043) scale(1.97787)" />
        <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '25', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10', strokeDasharray: 'none' }} d="m631.55 602.142 110.545 52.557" transform="translate(-531.257 -498.043) scale(1.97787)" />
      </g>
    </svg>
  );
}

function AudioIcon() {
  return (
    <Icon component={AudioIconComponent} />
  );
}

export default AudioIcon;
