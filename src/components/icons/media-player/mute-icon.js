import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function MuteIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '65', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M816.7 535.47h157.88m-170.46-199.1 137.78-77.09m-5.66 546.73-137.78-77.09" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '65', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M199.88 427.11v211" />
      <path style={{ fill: 'none' }} d="m210.46 634.1 82.97 48.99 319.95-489.95-403.02 235.1a20.556 20.556 0 0 1-10.38 2.82h-132c-12.11 0-21.94 9.83-21.94 21.92v156.3c0 12.11 9.83 21.94 21.94 21.94h132c3.69.01 7.3 1.01 10.48 2.88zm180.2 106.41 237.18 140.06c10.62 6.11 23.6 6.09 34.42-.17 10.85-6.28 17.3-17.5 17.3-30.03V298.1l-288.9 442.41z" />
      <path style={{ fill: 'currentColor' }} d="m270.87 717.64 22.56-34.55-82.97-48.99a20.668 20.668 0 0 0-10.48-2.87h-132c-12.11 0-21.94-9.83-21.94-21.94v-156.3c0-12.09 9.83-21.92 21.94-21.92h132c3.66 0 7.23-.98 10.38-2.82l403.02-235.1 35.18-53.88c-6.5-.32-13.04-.04-19.56 1.36-7.59 1.64-14.96 4.5-21.89 8.49-.05.02-.09.03-.12.07L194.42 389.84H67.98c-34.82 0-63.17 28.33-63.17 63.15v156.3c0 34.82 28.35 63.17 63.17 63.17h126.37l76.52 45.18zm408.7-419.54v552.27c0 12.53-6.46 23.74-17.3 30.03-10.81 6.26-23.8 6.28-34.42.17L390.66 740.51l-22.56 34.55 238.99 141.12c11.85 6.81 24.83 10.2 37.81 10.2 13.05 0 26.11-3.45 38-10.32 23.71-13.72 37.88-38.28 37.88-65.69v-615.4l-41.21 63.13z" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '65', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M765.82 62.85 194.9 937.15" />
    </svg>
  );
}

function MuteIcon() {
  return (
    <Icon component={MuteIconComponent} />
  );
}

export default MuteIcon;
