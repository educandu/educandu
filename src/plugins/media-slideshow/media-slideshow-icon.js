import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function MediaSlideshowIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: '#f2f2f2', stroke: '#666', strokeWidth: '38.2424', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M753.68 763.52H246.32c-48.24 0-87.35-39.11-87.35-87.35V323.83c0-48.24 39.11-87.35 87.35-87.35h507.36c48.24 0 87.35 39.11 87.35 87.35v352.35c0 48.24-39.11 87.34-87.35 87.34z" />
      <path style={{ fill: '#f2f2f2', stroke: '#666', strokeWidth: '38', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="m926.01 453.64 53.4 57.22m.18.1-53.4 57.23M73.99 453.64l-53.4 57.22m-.18.1 53.4 57.23" />
      <path style={{ fill: 'none', stroke: '#666', strokeWidth: '33.2105', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M556.03 557.52V355.68" />
      <ellipse style={{ fill: '#666' }} cx="491.29" cy="574.72" rx="84.92" ry="56.61" transform="rotate(-22.711 491.238 574.675)" />
    </svg>
  );
}

function MediaSlideshowIcon() {
  return (
    <Icon component={MediaSlideshowIconComponent} />
  );
}

export default MediaSlideshowIcon;
