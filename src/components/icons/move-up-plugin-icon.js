import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function MoveUpPluginIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '40', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M245.3 792.74V266.23m178.25 198.44L245.3 260.53 67.05 464.67m394.2-207.3h471.7M584.41 436.05h348.54M435.96 614.74h496.99m-500.6 178.68h500.6" />
    </svg>
  );
}

function MoveUpPluginIcon() {
  return (
    <Icon component={MoveUpPluginIconComponent} />
  );
}

export default MoveUpPluginIcon;
