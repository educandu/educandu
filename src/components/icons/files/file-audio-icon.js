import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function FileAudioIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '45', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M859.09 287.84v607.84c0 43.69-35.42 79.11-79.11 79.11H220.02c-43.69 0-79.11-35.42-79.11-79.11V104.32c0-43.69 35.42-79.11 79.11-79.11h385.24c14.46 0 28.3 5.91 38.3 16.35l200.78 209.59a52.995 52.995 0 0 1 14.75 36.69z" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '45', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M598.16 44.47V210.8c0 45.67 37.03 82.7 82.71 82.7h155.85" />
      <path style={{ display: 'inline', fill: 'currentColor' }} d="m498.205 464.02-168.85 107.75h-50.49c-10.4 0-18.83 8.43-18.83 18.83v69.17c0 10.4 8.43 18.83 18.83 18.83h50.49l168.85 109.08c16.31 9.37 36.65-2.41 36.65-21.22V485.24c0-18.81-20.34-30.59-36.65-21.22z" />
      <g style={{ display: 'inline' }}>
        <path style={{ strokeWidth: '45', strokeMiterlimit: '10', strokeDasharray: 'none', fill: '#f2f2f2', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round' }} d="M633.555 501.25h116.677M631.55 399.72l110.545-52.557" transform="translate(-25.276 125.85)" />
        <path style={{ fill: '#f2f2f2', stroke: 'currentColor', strokeWidth: '45', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10', strokeDasharray: 'none' }} d="m631.55 602.142 110.545 52.557" transform="translate(-25.276 125.85)" />
      </g>
    </svg>
  );
}

function FileAudioIcon() {
  return (
    <Icon component={FileAudioIconComponent} />
  );
}

export default FileAudioIcon;
