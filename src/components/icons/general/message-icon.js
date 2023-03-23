import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function MessageIconComponent() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 1000 1000" style={{ enableBackground: 'new 0 0 1000 1000' }} role="img" >
      <path d="M230.772 48.188h539.141c100.204 0 181.423 89.976 181.423 200.95v327.276c0 110.989-81.232 200.95-181.423 200.95H396.87c-1.077 0-2.077.46-2.79 1.351C348.247 835.59 274.074 928.11 252.39 955.16c-2.31 2.875-6.553 1.193-6.787-2.644l-10.926-171.112c-.142-2.271-1.855-4.039-3.919-4.039v0c-100.19 0-181.422-89.961-181.422-200.95V249.138c.013-110.974 81.232-200.95 181.435-200.95Z" style={{ fill: 'none', fillOpacity: 1, stroke: 'currentColor', strokeWidth: 40, strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: 10, strokeDasharray: 'none', strokeOpacity: 1 }} transform="matrix(1.01376 0 0 .91524 -6.757 45.264)" />
      <path d="M866.8 380.7c-11 0-20-9-20-20v-99.5c0-38.2-31.1-69.2-69.2-69.2h-57.4c-11 0-20-9-20-20s9-20 20-20h57.4c60.2 0 109.2 49 109.2 109.2v99.5c0 11-9 20-20 20z" style={{ fill: 'currentColor' }} transform="matrix(1.01376 0 0 .91524 -42.638 22.768)" />
      <path d="M869.1 509.2c-11 0-20-9-20-20v-58.1c0-11 9-20 20-20s20 9 20 20v58.1c0 11-9 20-20 20z" style={{ fill: 'currentColor' }} transform="matrix(1.01376 0 0 .91524 -44.368 49.076)" />
      <circle cx={493} cy={622.6} r={40.6} style={{ fill: 'currentColor' }} transform="matrix(-.93092 0 0 -.91524 951.192 844.66)" />
      <path d="M493 228.8c-29.1 0-36.722 26.5-34.622 57.6L458.4 510c.6 20 15.9 35.9 34.5 35.9 18.7 0 33.9-15.9 34.5-35.9l-.103-223.851c2.3-31.2-5.197-57.349-34.297-57.349Z" style={{ fill: 'currentColor' }} transform="matrix(-.93092 0 0 -.91524 951.192 844.66)" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <Icon component={MessageIconComponent} />
  );
}

export default MessageIcon;
