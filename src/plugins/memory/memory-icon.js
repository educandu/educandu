import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function MemoryIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: '#f2f2f2', stroke: '#666', strokeWidth: '40', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M459.02 462.09H67.54a3.26 3.26 0 0 1-3.26-3.26V150.86c0-1.8 1.46-3.26 3.26-3.26h391.47c1.8 0 3.26 1.46 3.26 3.26v307.97c.01 1.8-1.45 3.26-3.25 3.26zm0 390.31H67.54a3.26 3.26 0 0 1-3.26-3.26V541.17c0-1.8 1.46-3.26 3.26-3.26h391.47c1.8 0 3.26 1.46 3.26 3.26v307.97c.01 1.8-1.45 3.26-3.25 3.26zm473.44-390.31H540.98a3.26 3.26 0 0 1-3.26-3.26V150.86c0-1.8 1.46-3.26 3.26-3.26h391.47c1.8 0 3.26 1.46 3.26 3.26v307.97c.01 1.8-1.45 3.26-3.25 3.26zm0 390.31H540.98a3.26 3.26 0 0 1-3.26-3.26V541.17c0-1.8 1.46-3.26 3.26-3.26h391.47c1.8 0 3.26 1.46 3.26 3.26v307.97c.01 1.8-1.45 3.26-3.25 3.26z" />
    </svg>
  );
}

function MemoryIcon() {
  return (
    <Icon component={MemoryIconComponent} />
  );
}

export default MemoryIcon;
