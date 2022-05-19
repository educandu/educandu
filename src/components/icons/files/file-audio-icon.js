import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function FileAudioIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '45', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M837.96 856.26H162.04c-45.31 0-82.03-36.73-82.03-82.03V225.78c0-45.31 36.73-82.03 82.03-82.03h675.92c45.31 0 82.03 36.73 82.03 82.03v548.45c0 45.3-36.72 82.03-82.03 82.03z" />
      <path style={{ fill: 'currentColor' }} d="M491.48 338.17 322.63 445.92h-50.49c-10.4 0-18.83 8.43-18.83 18.83v69.17c0 10.4 8.43 18.83 18.83 18.83h50.49l168.85 109.08c16.31 9.37 36.65-2.41 36.65-21.22V359.39c0-18.81-20.34-30.59-36.65-21.22z" />
      <path style={{ strokeWidth: '45', strokeMiterlimit: '10', strokeDasharray: 'none', fill: 'currentColor', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round' }} d="M633.555 501.25h116.677M631.55 399.72l110.545-52.557" transform="translate(-4)" />
      <path style={{ fill: 'currentColor', stroke: 'currentColor', strokeWidth: '45', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10', strokeDasharray: 'none' }} d="m631.55 602.142 110.545 52.557" transform="translate(-4)" />
    </svg>
  );
}

function FileAudioIcon() {
  return (
    <Icon component={FileAudioIconComponent} />
  );
}

export default FileAudioIcon;
