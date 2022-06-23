import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function FolderIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '50', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M728.93 817.36H163.7c-27.83 0-47.39-24.94-38.34-48.91l123.6-327.4c5.63-14.91 21.03-24.91 38.34-24.91h565.23c27.83 0 47.39 24.94 38.34 48.91l-123.6 327.4c-5.62 14.9-21.03 24.91-38.34 24.91z" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '50', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M757.87 414.88v-92.99c0-19.7-18.68-35.66-41.72-35.66H438.01l-110.56-93.29c-7.81-6.59-18.34-10.28-29.31-10.28H148.61c-23.04 0-41.72 15.97-41.72 35.66V781.7c0 19.7 18.68 35.66 41.72 35.66" />
    </svg>
  );
}

function FolderIcon(props) {
  return (
    <Icon component={FolderIconComponent} {...props} />
  );
}

export default FolderIcon;
