import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function AudioWaveformIconComponent() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 1000 1000" style={{ enableBackground: 'new 0 0 1000 1000' }} role="img" >
      <path style={{ fill: 'none', stroke: '#666', strokeWidth: 30.4797, strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: 10 }} d="M18.2 471.76v56.48m68.83-104.26v152.04m68.83-182.2v212.36m68.83-323.4v434.44m68.82-376.13v317.82m68.83-265.09v212.36m68.83-182.2v152.04M500 453.19v93.62m68.83-200.72v307.82m68.83-307.82v307.82M706.49 288v424m68.82-326.3v228.6m68.83-268.21v307.82m68.83-256.74v205.66m68.83-131.07v56.48" />
    </svg>
  );
}

function AudioWaveformIcon() {
  return (
    <Icon component={AudioWaveformIconComponent} />
  );
}

export default AudioWaveformIcon;
