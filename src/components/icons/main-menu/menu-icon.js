import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function MenuIconComponent() {
  return (
    <svg height="1.5em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1.5em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'currentColor' }} d="M856.14 317.19H143.86c-33.65 0-60.94-27.28-60.94-60.94s27.28-60.94 60.94-60.94h712.29c33.65 0 60.94 27.28 60.94 60.94s-27.29 60.94-60.95 60.94zm0 243.75H143.86c-33.65 0-60.94-27.28-60.94-60.94s27.28-60.94 60.94-60.94h712.29c33.65 0 60.94 27.28 60.94 60.94s-27.29 60.94-60.95 60.94zm0 243.75H143.86c-33.65 0-60.94-27.28-60.94-60.94s27.28-60.94 60.94-60.94h712.29c33.65 0 60.94 27.28 60.94 60.94-.01 33.66-27.29 60.94-60.95 60.94z" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <Icon component={MenuIconComponent} />
  );
}

export default MenuIcon;
