import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function MarkdownWithImageIconComponent() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 1000 1000" style={{ enableBackground: 'new 0 0 1000 1000' }} role="img" >
      <g transform="translate(17.357 -8.984) scale(.59198)">
        <path d="M940.76 866.84H59.24c-15.57-18.928-3.203-53.11-7.16-78.245V179.9c18.928-15.57 53.11-3.203 78.245-7.16H940.77c15.57 18.928 3.203 53.11 7.16 78.245V859.68l-2.104 5.065z" style={{ strokeWidth: 59.1235, strokeMiterlimit: 10, strokeDasharray: 'none', fill: '#f2f2f2', stroke: '#666', strokeLinecap: 'round', strokeLinejoin: 'round' }} />
        <ellipse cx={405.83} cy={410.28} rx={84.83} ry={85.06} style={{ fill: '#666' }} />
        <path d="M938.1 854.05c-85.109-129.13-167.092-260.596-254.16-388.261-42.588-34.545-74.42 17.97-93.049 50.61L440.2 748.2c-40.25-37.826-74.865-82.843-119.025-115.696-48.12-15.993-73.066 38.742-104.606 64.234L62.06 854.05H938.1z" style={{ fill: '#666' }} />
      </g>
      <path style={{ fill: 'none', stroke: '#666', strokeWidth: 40, strokeLinecap: 'round', strokeLinejoin: 'miter', strokeMiterlimit: 4, strokeDasharray: 'none', strokeOpacity: 1 }} d="M655.564 99.433h278.098M657.513 230.47H935.61M655.536 358.736h278.098M656.181 491.854H934.28M57.361 620.212h876.301M57.361 748.446h876.301M57.361 878.185h876.301" />
    </svg>
  );
}

function MarkdownWithImageIcon() {
  return (
    <Icon component={MarkdownWithImageIconComponent} />
  );
}

export default MarkdownWithImageIcon;
