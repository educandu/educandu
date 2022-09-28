import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function SoloIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: '#E8E8E8', stroke: 'currentColor', strokeWidth: '65', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M617.36 166.78 199.98 410.26H67.97c-23.49 0-42.54 19.05-42.54 42.54v156.3c0 23.5 19.05 42.55 42.54 42.55h132.01l417.38 246.47c36.85 21.16 82.81-5.44 82.81-47.94V214.72c0-42.5-45.96-69.1-82.81-47.94zM816.7 535.29h157.88M804.12 336.18l137.77-77.09m-5.66 546.73-137.77-77.09" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '65', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M199.87 426.92v211" />
    </svg>
  );
}

function SoloIcon() {
  return (
    <Icon component={SoloIconComponent} />
  );
}

export default SoloIcon;
