import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function FilterIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '100', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M846.78 276.58H152.99m560.9 221.48H278.5m309.88 221.48H404.01" />
    </svg>
  );
}

function FilterIcon(props) {
  return (
    <Icon component={FilterIconComponent} {...props} />
  );
}

export default FilterIcon;
