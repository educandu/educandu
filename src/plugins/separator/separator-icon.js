import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function SeparatorIconComponent() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 1000 1000" style={{ enableBackground: 'new 0 0 1000 1000' }} role="img" >
      <path style={{ fill: 'none', stroke: '#666', strokeWidth: 61.0049, strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: 10 }} d="M39.62 500h917.87" />
      <path style={{ fill: 'none', stroke: '#666', strokeWidth: 34.8599, strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: 10 }} d="M27.74 168.83H93m412.56 0h47.83m-386.21 0h271.07M27.74 831.17h326.71m74.18 0h34.64M27.74 308.27h499m74.11 0h137.51m73.9 0h38.14M27.74 691.73h188.9m617.79 0h137.83m-680.8 0h468.09" />
    </svg>
  );
}

function SeparatorIcon() {
  return (
    <Icon component={SeparatorIconComponent} />
  );
}

export default SeparatorIcon;
