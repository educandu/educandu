import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function LanguageIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <ellipse style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '60', strokeLinecap: 'round', strokeMiterlimit: '10' }} cx="500" cy="500" rx="468.84" ry="463.47" />
      <ellipse style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '60', strokeLinecap: 'round', strokeMiterlimit: '10' }} cx="500" cy="500" rx="207.55" ry="463.47" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '60', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M66.17 385.92h872.26M66.17 662.72h872.26" />
    </svg>
  );
}

function LanguageIcon(props) {
  return (
    <Icon component={LanguageIconComponent} {...props} />
  );
}

export default LanguageIcon;
