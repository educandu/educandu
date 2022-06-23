import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function ViewHistoryIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: '#fff' }} d="M836.46 401.19c55.72 181.77-47.02 374.12-229.5 429.63s-375.57-46.84-431.29-228.61c-46.38-151.29 17.03-309.92 144.81-390.87 25.74-16.31 54.09-29.46 84.68-38.76 182.48-55.51 375.57 46.84 431.3 228.61z" />
      <path style={{ fill: '#fff', stroke: '#2f2d7e', strokeWidth: '40', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M320.48 211.35c25.74-16.31 54.09-29.46 84.68-38.76 182.47-55.51 375.57 46.84 431.29 228.61s-47.02 374.12-229.5 429.63-375.57-46.84-431.29-228.61C144.42 500.3 163 395.06 217.51 312.48" />
      <path style={{ fill: 'none', stroke: '#2f2d7e', strokeWidth: '40', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="m326.64 154.08-24.14 65.54 68.06 16.65m135.5 253.6V256.7m0 232.21 119.17 93.79" />
    </svg>
  );
}

function ViewHistoryIcon(props) {
  return (
    <Icon component={ViewHistoryIconComponent} {...props} />
  );
}

export default ViewHistoryIcon;
