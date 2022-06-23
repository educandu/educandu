import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function FolderIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: '#fff', stroke: 'currentColor', strokeWidth: '45', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M823.37 876.59H27.95V183.4c0-33.13 25.43-59.99 56.8-59.99h161.73c17.29 0 33.65 8.32 44.42 22.6l46.85 62.09c10.78 14.28 27.13 22.6 44.42 22.6h384.38c31.37 0 56.8 26.86 56.8 59.99v585.9z" />
      <path style={{ fill: '#fff', stroke: 'currentColor', strokeWidth: '45', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M823.37 876.59H27.95l157.5-465.11c7.09-21.33 26.16-35.61 47.56-35.61H921.6c34.74 0 59.06 36.24 47.56 70.85L823.37 876.59z" />
    </svg>
  );
}

function FolderIcon(props) {
  return (
    <Icon component={FolderIconComponent} {...props} />
  );
}

export default FolderIcon;
