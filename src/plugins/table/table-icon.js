import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function TableIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: '#f2f2f2', stroke: '#666', strokeWidth: '40', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M843.01 237.4v673.11c0-5.41-8.52 2.06-19.03 2.06H176.02c-10.51 0-19.03-7.46-19.03-2.06v-791.8c0-23.82 8.52-31.29 19.03-31.29h647.96c10.51 0 19.03 7.46 19.03 16.67v38.87M167.5 260.69h655.82m-440.87 2.86v633.39m230.44-633.39v633.39" />
      <path style={{ fill: '#f2f2f2', stroke: '#666', strokeWidth: '34', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M213.21 401.99h111.85m358.35 0h86.39M213.21 577.37h42.11m189.05 0h78.84m160.2 0H790.5M213.21 752.75h76.5m154.66 0h41.73M444.37 402.6h41.73m197.31 350.15h47.4" />
    </svg>
  );
}

function TableIcon() {
  return (
    <Icon component={TableIconComponent} />
  );
}

export default TableIcon;
