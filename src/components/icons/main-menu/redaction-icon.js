import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function RedactionIconComponent() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 1000 1000" style={{ enableBackground: 'new 0 0 1000 1000' }} role="img" >
      <path d="M915.83 260.45v520.42c0 37.37-30.29 67.66-67.66 67.66H369.23c-37.37 0-67.66-30.29-67.66-67.66V104c0-37.37 30.29-67.66 67.66-67.66h331.82l214.78 224.11z" style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 61.4772, strokeLinecap: 'round', strokeMiterlimit: 10 }} />
      <path d="M301.57 152.74h-45.51c-37.37 0-67.66 30.29-67.66 67.66v676.87c0 37.37 30.29 67.66 67.66 67.66H735c37.37 0 67.66-30.29 67.66-67.66v-48.75" style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 61.4772, strokeLinecap: 'square', strokeMiterlimit: 10 }} />
      <path d="M683.46 37.59v172.65c0 37.57 30.46 68.02 68.02 68.02h162.54" style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 61.4772, strokeLinejoin: 'bevel', strokeMiterlimit: 10 }} />
    </svg>
  );
}

function RedactionIcon() {
  return (
    <Icon component={RedactionIconComponent} />
  );
}

export default RedactionIcon;
