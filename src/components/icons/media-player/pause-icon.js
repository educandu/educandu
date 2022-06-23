import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function PauseIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'currentColor' }} d="M664.95 899.66c-42.91 0-77.7-34.79-77.7-77.7V178.04c0-42.91 34.79-77.7 77.7-77.7 42.91 0 77.7 34.79 77.7 77.7v643.92c0 42.91-34.79 77.7-77.7 77.7zm-329.9 0c-42.91 0-77.7-34.79-77.7-77.7V178.04c0-42.91 34.79-77.7 77.7-77.7 42.91 0 77.7 34.79 77.7 77.7v643.92c.01 42.91-34.78 77.7-77.7 77.7z" />
    </svg>
  );
}

function PauseIcon(props) {
  return (
    <Icon component={PauseIconComponent} {...props} />
  );
}

export default PauseIcon;
