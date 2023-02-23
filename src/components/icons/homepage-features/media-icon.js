import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function MediaIconComponent() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 1000 1000" style={{ enableBackground: 'new 0 0 1000 1000' }} role="img" >
      <path d="M500 907.4C275.4 907.4 92.6 724.6 92.6 500S275.4 92.6 500 92.6 907.4 275.4 907.4 500 724.6 907.4 500 907.4zm0-778.7c-204.7 0-371.3 166.6-371.3 371.3S295.3 871.3 500 871.3 871.3 704.7 871.3 500 704.7 128.7 500 128.7z" style={{ fill: 'currentColor' }} />
      <path d="M794 539c-10 0-18-8.1-18-18 0-19.6-1.9-39.1-5.8-58.1-2-9.8 4.4-19.3 14.1-21.2 9.7-2 19.3 4.4 21.2 14.1 4.3 21.3 6.5 43.3 6.5 65.2.1 10-8 18-18 18zm-19.5-108.9c-7.3 0-14.2-4.5-16.9-11.7-36.1-96.8-121.6-168.1-223.1-186.2-9.8-1.7-16.3-11.1-14.6-20.9 1.7-9.8 11.1-16.3 20.9-14.6 114 20.3 210 100.4 250.6 209 3.5 9.3-1.3 19.7-10.6 23.2-2.1.9-4.2 1.2-6.3 1.2zm-128.3 55.3L447.3 370.5c-11.2-6.5-25.3 1.6-25.3 14.6v229.7c0 13 14.1 21.1 25.3 14.6l198.9-114.9c11.3-6.4 11.3-22.6 0-29.1z" style={{ fill: 'currentColor' }} />
    </svg>
  );
}

function MediaIcon() {
  return (
    <Icon component={MediaIconComponent} />
  );
}

export default MediaIcon;
