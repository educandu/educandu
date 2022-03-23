import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function CookieAlertIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '26.4282', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M885.05 672.75c22.46-53.1 34.88-111.47 34.88-172.75 0-7.72-.2-15.39-.59-23.02-7.91-.01-15.95-1-23.94-3.25-31.31-8.83-53.82-33.45-61.54-62.79-25.11 5.91-52.01 5.78-78.59-1.72-83.65-23.57-132.36-110.5-108.78-194.15 1.6-5.68 3.54-11.16 5.71-16.5-33.44-29-49.65-75.08-38.6-120.57-43.3-14.1-89.47-21.81-137.47-21.81C231 56.19 32.3 254.89 32.3 500S231 943.81 476.11 943.81c134.72 0 255.42-60.03 336.82-154.79" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '26.4282', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M437.58 730.98c-6.33 27.88-31.27 48.7-61.07 48.7-34.59 0-62.63-28.04-62.63-62.63s28.04-62.63 62.63-62.63c20.15 0 38.08 9.52 49.54 24.31m37.31-357.58c-1.07 24.8-15.39 48.22-39.3 59.78-34.65 16.75-76.31 2.25-93.07-32.4-16.75-34.65-2.25-76.31 32.4-93.07 20.19-9.76 42.76-8.91 61.39.35" />
      <circle style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '26.4282', strokeLinecap: 'round', strokeMiterlimit: '10' }} cx="211.14" cy="523.86" r="44.52" />
      <circle style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '26.4282', strokeLinecap: 'round', strokeMiterlimit: '10' }} cx="546.34" cy="508.13" r="49.47" />
      <circle style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '26.4282', strokeLinecap: 'round', strokeMiterlimit: '10' }} cx="651.22" cy="721.14" r="45.33" />
      <circle style={{ fill: 'currentColor' }} cx="855.86" cy="299.49" r="29.24" />
      <circle style={{ fill: 'currentColor' }} cx="737.76" cy="266.72" r="29.24" />
      <circle style={{ fill: 'currentColor' }} cx="893.8" cy="196.77" r="29.24" />
      <circle style={{ fill: 'currentColor' }} cx="951.68" cy="383.81" r="29.24" />
      <circle style={{ fill: 'currentColor' }} cx="799.42" cy="181.3" r="29.24" />
    </svg>
  );
}

function CookieAlertIcon() {
  return (
    <Icon component={CookieAlertIconComponent} />
  );
}

export default CookieAlertIcon;
