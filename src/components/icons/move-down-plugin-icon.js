import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function MoveDownPluginIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '40', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M244.49 222.79v551.05M65.68 566.15 244.49 779.8 423.3 566.15m37.83 214.37h473.19M584.68 593.51h349.64M435.76 406.49h498.56M432.13 219.48h502.19" />
    </svg>
  );
}

function MoveDownPluginIcon() {
  return (
    <Icon component={MoveDownPluginIconComponent} />
  );
}

export default MoveDownPluginIcon;
