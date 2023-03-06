import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function RhythmIconComponent() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 1000 1000" style={{ enableBackground: 'new 0 0 1000 1000' }} role="img" >
      <path d="M672.9 707.8c2.2-3.2 3.6-7.2 3.6-11.4V20c0-11-9-20-20-20s-20 9-20 20v669L499.1 812.8 356.9 684.6c-8.2-7.4-20.9-6.7-28.2 1.5-7.4 8.2-6.7 20.9 1.5 28.2l139.1 125.4-139.1 125.4c-8.2 7.4-8.9 20-1.5 28.2 3.9 4.4 9.4 6.6 14.9 6.6 4.8 0 9.6-1.7 13.4-5.1l142.2-128.2 142.2 128.2c3.8 3.4 8.6 5.1 13.4 5.1 5.5 0 10.9-2.2 14.9-6.6 7.4-8.2 6.7-20.9-1.5-28.2L529 839.8l139.1-125.4c2.1-1.9 3.7-4.2 4.8-6.6z" style={{ fill: 'currentColor' }} />
    </svg>
  );
}

function RhythmIcon() {
  return (
    <Icon component={RhythmIconComponent} />
  );
}

export default RhythmIcon;
