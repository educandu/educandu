import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function FileAudioFilledIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: '#f2f2f2', stroke: 'currentColor', strokeWidth: '20', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M77.44 257.98V224.1c0-45.58 36.95-82.53 82.53-82.53h680.05c45.58 0 82.53 36.95 82.53 82.53v551.8c0 45.58-36.95 82.53-82.53 82.53H159.98c-45.58 0-82.53-36.95-82.53-82.53V529.35m-.01-136.51v-57.75" />
      <path style={{ fill: 'currentColor' }} d="M535.7 326.33 365.82 434.74h-50.8c-10.46 0-18.94 8.48-18.94 18.94v69.59c0 10.46 8.48 18.95 18.94 18.95h50.8L535.7 651.96c16.41 9.42 36.87-2.42 36.87-21.35V347.68c0-18.93-20.46-30.77-36.87-21.35z" />
      <path style={{ fill: '#f2f2f2', stroke: 'currentColor', strokeWidth: '20', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M624.46 490.41h70.29m-75.9-88.65 61.35-34.33m-2.52 243.43-61.34-34.32" />
    </svg>
  );
}

function FileAudioFilledIcon() {
  return (
    <Icon component={FileAudioFilledIconComponent} />
  );
}

export default FileAudioFilledIcon;
