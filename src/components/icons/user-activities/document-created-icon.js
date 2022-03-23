import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function DocumentCreatedIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '60', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M685.64 563.86v153.19m-3.13 101.06v23.94c0 39.42-31.96 71.38-71.38 71.38H168.09c-39.42 0-71.38-31.96-71.38-71.38v-684.1c0-39.42 31.96-71.38 71.38-71.38h443.04c39.42 0 71.38 31.96 74.51 71.38v70.87" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '81.1986', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M769.21 273.18v234.51m117.26-117.25H651.95" />
    </svg>
  );
}

function DocumentCreatedIcon() {
  return (
    <Icon component={DocumentCreatedIconComponent} />
  );
}

export default DocumentCreatedIcon;
