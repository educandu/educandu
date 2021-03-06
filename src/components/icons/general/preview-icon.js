import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function PreviewIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'currentColor' }} d="M523.34 723.64c-191.67 0-355.1-129.13-416.46-184.65-13.06-11.83-20.56-28.69-20.56-46.27s7.5-34.44 20.56-46.27c61.36-55.52 224.79-184.65 416.46-184.65s355.1 129.12 416.47 184.65c13.06 11.83 20.56 28.69 20.56 46.27s-7.5 34.44-20.56 46.27c-61.36 55.52-224.78 184.65-416.47 184.65zm0-415.78c-175.67 0-328.17 120.81-385.57 172.76-3.48 3.15-5.41 7.45-5.41 12.12s1.92 8.97 5.41 12.12c57.41 51.94 209.9 172.76 385.57 172.76 175.68 0 328.18-120.81 385.58-172.76 3.48-3.15 5.41-7.45 5.41-12.12s-1.92-8.97-5.41-12.12c-57.4-51.95-209.9-172.76-385.58-172.76z" />
      <path style={{ fill: 'currentColor' }} d="M523.34 654.37c-89.13 0-161.63-72.51-161.63-161.64s72.5-161.64 161.63-161.64 161.64 72.51 161.64 161.64-72.51 161.64-161.64 161.64zm0-277.24c-63.73 0-115.59 51.85-115.59 115.6s51.85 115.6 115.59 115.6 115.6-51.85 115.6-115.6-51.85-115.6-115.6-115.6z" />
    </svg>
  );
}

function PreviewIcon(props) {
  return (
    <Icon component={PreviewIconComponent} {...props} />
  );
}

export default PreviewIcon;
