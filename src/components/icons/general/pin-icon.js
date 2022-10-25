import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function PinIconComponent() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 1000 1000" style={{ enableBackground: 'new 0 0 1000 1000' }} role="img" >
      <path d="M497.527 984.857c-.735-2.851-4.428-22.051-8.207-42.665-11.955-65.204-32.63-135.317-60.69-205.804-16.11-40.466-19.023-46.916-66.088-146.337-76.05-160.645-89.415-205.753-86.604-292.271 2.577-79.286 22.266-138.687 65.005-196.128 35.476-47.677 74.852-75.177 122.75-85.724C582.395-10.21 697.555 95.985 720.888 253.096c5.44 36.628 4.232 99.666-2.565 133.913-7.456 37.568-37.37 113.575-79.649 202.365-76.308 160.265-105.202 240.311-126.836 351.392-8.377 43.004-11.84 53.68-14.31 44.091z" style={{ fill: 'none', fillOpacity: 1, stroke: 'currentColor', strokeWidth: 65, strokeMiterlimit: 4, strokeDasharray: 'none', strokeOpacity: 1 }} transform="matrix(1.00253 0 0 .94888 -1.38 25.652)" />
    </svg>
  );
}

function PinIcon() {
  return (
    <Icon component={PinIconComponent} />
  );
}

export default PinIcon;
