import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function ImageIconComponent() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 1000 1000" style={{ enableBackground: 'new 0 0 1000 1000' }} role="img" >
      <path d="M786.2 186.8H213.7c-63.1 0-114.4 51.3-114.4 114.4v397.6c0 63.1 51.3 114.4 114.4 114.4h572.5c63.1 0 114.4-51.3 114.4-114.4V301.2c.1-63.1-51.3-114.4-114.4-114.4zm82.8 512c0 23.8-10.1 45.3-26.2 60.4l-185-275.3c-14.9-21.7-51.6-22.1-67.2-.8L447.8 682.7 337.1 581.4c-10.3-15-35.7-15.3-46.4-.5L159.5 761.2C142.1 746 131 723.7 131 698.8V301.2c0-45.6 37.1-82.7 82.7-82.7h572.5c45.6 0 82.7 37.1 82.7 82.7v397.6z" style={{ fill: 'currentColor' }} />
      <circle transform="rotate(-45.001 421.28 406.72)" cx={421.3} cy={406.7} style={{ fill: 'currentColor' }} r={72.9} />
    </svg>
  );
}

function ImageIcon() {
  return (
    <Icon component={ImageIconComponent} />
  );
}

export default ImageIcon;
