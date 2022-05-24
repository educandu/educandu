import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function LogoutIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '80', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M326.39 228.55c-105.62 58.97-176.97 169.82-176.97 297.13 0 189.05 156.97 342.31 350.58 342.31 193.63 0 350.58-153.26 350.58-342.31 0-127.31-71.35-238.16-176.97-297.13M500 132.01v371.1" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <Icon component={LogoutIconComponent} />
  );
}

export default LogoutIcon;
