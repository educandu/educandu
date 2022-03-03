import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function DuplicatePluginIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '40', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M90.94 183.64h723.18v723.18H90.94z" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '40', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M185.88 93.19h723.18v723.17M452.53 410.59v269.27m134.63-134.63H317.9" />
    </svg>
  );
}

function DuplicatePluginIcon() {
  return (
    <Icon component={DuplicatePluginIconComponent} />
  );
}

export default DuplicatePluginIcon;
