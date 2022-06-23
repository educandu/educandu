import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function FolderFilledNavigateIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: '#fff', stroke: 'currentColor', strokeWidth: '20', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M25.07 300.87v-119.4c0-33.33 25.59-60.35 57.15-60.35h162.72c17.4 0 33.85 8.37 44.69 22.74l47.14 62.47c10.84 14.37 27.3 22.74 44.69 22.74h386.72c31.56 0 57.15 27.02 57.15 60.35V878.9H25.07V502.04" />
      <path style={{ fill: '#f2f2f2', stroke: 'currentColor', strokeWidth: '20', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M825.35 878.89H25.07l158.46-467.95c7.13-21.46 26.32-35.82 47.85-35.82h692.79c34.95 0 59.42 36.46 47.85 71.28L825.35 878.89z" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '50', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M484.68 143.77v503.51M676.22 461.9 483.78 647.28" transform="rotate(90 187.546 547.73) scale(.5517)" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '50', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="m292.74 461.9 192.44 185.38" transform="rotate(90 187.546 547.73) scale(.5517)" />
    </svg>
  );
}

function FolderFilledNavigateIcon(props) {
  return (
    <Icon component={FolderFilledNavigateIconComponent} {...props} />
  );
}

export default FolderFilledNavigateIcon;
