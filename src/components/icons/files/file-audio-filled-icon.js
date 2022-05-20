
import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function FileAudioFilledIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: '#f2f2f2', stroke: 'currentColor', strokeWidth: '20', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M138.72 363.74V101.9c0-43.96 35.63-79.59 79.59-79.59H605.9c14.55 0 28.47 5.94 38.54 16.45l202.01 210.87a53.346 53.346 0 0 1 14.83 36.92V898.1c0 43.96-35.63 79.59-79.59 79.59H218.31c-43.96 0-79.59-35.63-79.59-79.59V521.3" transform="translate(-8.461 2.225)" />
      <path style={{ fill: '#fff', stroke: 'currentColor', strokeWidth: '20', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M861.28 292.23v-5.69c0-13.76-5.31-26.98-14.83-36.92L644.44 38.76a53.373 53.373 0 0 0-38.54-16.45h-7.14v186.72c0 45.95 37.26 83.2 83.21 83.2h156.8z" transform="translate(-8.461 2.225)" />
      <path style={{ display: 'inline', fill: 'currentColor' }} d="m493.272 463.594-168.85 107.75h-50.49c-10.4 0-18.83 8.43-18.83 18.83v69.17c0 10.4 8.43 18.83 18.83 18.83h50.49l168.85 109.08c16.31 9.37 36.65-2.41 36.65-21.22v-281.22c0-18.81-20.34-30.59-36.65-21.22z" />
      <g style={{ display: 'inline' }}>
        <path style={{ strokeWidth: '20', strokeMiterlimit: '10', strokeDasharray: 'none', fill: '#f2f2f2', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round' }} d="M633.555 501.25h116.677M631.55 399.72l110.545-52.557" transform="translate(-30.208 125.424)" />
        <path style={{ fill: '#f2f2f2', stroke: 'currentColor', strokeWidth: '20', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10', strokeDasharray: 'none' }} d="m631.55 602.142 110.545 52.557" transform="translate(-30.208 125.424)" />
      </g>
    </svg>
  );
}

function FileAudioFilledIcon() {
  return (
    <Icon component={FileAudioFilledIconComponent} />
  );
}

export default FileAudioFilledIcon;
