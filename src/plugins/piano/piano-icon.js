import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function PianoIconComponent() {
  return (
    <svg width="1.2em" height="1.2em" style={{ enableBackground: 'new 0 0 1000 1000'}} viewBox="0 0 1000 1000" >
      <path d="M949.33 756.29H50.67c-19.5 0-35.31-15.81-35.31-35.31V279.02c0-19.5 15.81-35.31 35.31-35.31h898.66c19.5 0 35.31 15.81 35.31 35.31v441.97c0 19.49-15.81 35.3-35.31 35.3z" style={{ fill: '#f2f2f2', stroke: '#666', strokeWidth: 23.728, strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: 10 }} />
      <path d="M249.97 571.93h-83.51c-12.36 0-22.38-10.02-22.38-22.38V246.04h128.28v303.51c0 12.36-10.03 22.38-22.39 22.38zm193.94 0H360.4c-12.36 0-22.38-10.02-22.38-22.38V246.04H466.3v303.51c-.01 12.36-10.03 22.38-22.39 22.38zm387.36 0h-83.51c-12.36 0-22.38-10.02-22.38-22.38V246.04h128.28v303.51c-.01 12.36-10.03 22.38-22.39 22.38z" style={{ fill: '#666' }} />
      <path d="M208.2 242.69V766.2m193.84-523.51V766.2m193.84-523.51V766.2m193.85-523.51V766.2" style={{ fill: 'none', stroke: '#666', strokeWidth: 23.728, strokeLinejoin: 'round', strokeMiterlimit: 10 }} />
    </svg>
  );
}

function PianoIcon() {
  return (
    <Icon component={PianoIconComponent} />
  );
}

export default PianoIcon;
