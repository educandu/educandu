import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function RoomIconComponent() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 1000 1000" style={{ enableBackground: 'new 0 0 1000 1000' }} role="img" >
      <path d="M739.9 159.1H612c-.5-10.8-5.4-21.1-13.6-28.4-8.8-7.9-20.7-11.5-32.5-10.2l-350.6 40.6v677.7l350.6 40.6c1.6.2 3.2.3 4.8.3 10.2 0 20.1-3.7 27.7-10.5 8.2-7.3 13.1-17.5 13.6-28.4h128c24.7 0 44.8-20.1 44.8-44.8V203.9c0-24.7-20.1-44.8-44.9-44.8zM575 838.8c0 1.3-.7 2.2-1.3 2.7-.6.5-1.8 1.3-3.6 1.1l-317.8-36.8V194.1l317.9-36.8c1.7-.2 3 .6 3.5 1.1.6.5 1.3 1.4 1.3 2.7v677.7zm172.7-42.7c0 4.3-3.5 7.8-7.8 7.8H612V196.2h127.9c4.3 0 7.8 3.5 7.8 7.8v592.1z" style={{ fill: 'currentColor' }} />
      <ellipse cx={505.4} cy={508.2} rx={33.3} ry={39.7} style={{ fill: 'currentColor' }} />
      <path d="M505.4 468.6c-18.4 0-33.3 17.8-33.3 39.7 0 21.9 14.9 39.7 33.3 39.7s33.3-17.8 33.3-39.7c0-22-14.9-39.7-33.3-39.7z" style={{ fill: 'currentColor' }} />
    </svg>
  );
}

function RoomIcon() {
  return (
    <Icon component={RoomIconComponent} />
  );
}

export default RoomIcon;
