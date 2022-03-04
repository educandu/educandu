import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function AudioIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: '#f2f2f2', stroke: '#666', strokeWidth: '40', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M610.05 157.1 218.66 385.41H57.19c-1.22 0-2.21.99-2.21 2.21v221.94c0 1.22.99 2.21 2.21 2.21h161.47L610.05 842.9c34.56 19.85 77.66-5.1 77.66-44.96V202.06c0-39.86-43.1-64.81-77.66-44.96z" />
      <path style={{ fill: '#f2f2f2', stroke: '#666', strokeWidth: '40', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M312.22 429.14c10.61-5.31 151.22-83.57 151.22-83.57m64.99-35.81c10.61-5.31 53.06-29.18 53.06-29.18M215.03 389.29v214.25m581.95-100.89h148.04m-159.84-186.7 129.19-72.29m-5.3 512.68-129.2-72.29" />
    </svg>
  );
}

function AudioIcon() {
  return (
    <Icon component={AudioIconComponent} />
  );
}

export default AudioIcon;
