import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function EditPluginIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '40', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M332.72 906.89 944.21 295.4c25.73-25.73 21.92-71.26-8.51-101.69L803.69 61.7C773.26 31.27 727.73 27.46 702 53.19L90.51 664.68 33.09 931.74c-2.83 17.71 14.82 35.37 32.53 32.53l267.1-57.38zm478.4-597.2L375.91 744.9m113.74-223.52L316.46 694.57m-151.85 40.46L324.5 894.92m-179.86 47.91-90.12-90.11" />
    </svg>
  );
}

function EditPluginIcon() {
  return (
    <Icon component={EditPluginIconComponent} />
  );
}

export default EditPluginIcon;
