
import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function FileImageFilledIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: '#f2f2f2', stroke: 'currentColor', strokeWidth: '20', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M138.72 363.74V101.9c0-43.96 35.63-79.59 79.59-79.59H605.9c14.55 0 28.47 5.94 38.54 16.45l202.01 210.87a53.346 53.346 0 0 1 14.83 36.92V898.1c0 43.96-35.63 79.59-79.59 79.59H218.31c-43.96 0-79.59-35.63-79.59-79.59V521.3" transform="translate(-4.842 1.245)" />
      <path style={{ fill: '#fff', stroke: 'currentColor', strokeWidth: '20', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M861.28 292.23v-5.69c0-13.76-5.31-26.98-14.83-36.92L644.44 38.76a53.373 53.373 0 0 0-38.54-16.45h-7.14v186.72c0 45.95 37.26 83.2 83.21 83.2h156.8z" transform="translate(-4.842 1.245)" />
      <path style={{ display: 'inline', fill: 'currentColor', strokeWidth: '1' }} d="M583.264 508.697 414.384 745.02c-15.479 21.666.006 51.762 26.628 51.762h337.754c26.629 0 42.114-30.096 26.629-51.762L636.529 508.697c-13.057-18.273-40.208-18.273-53.265 0z" />
      <path style={{ display: 'inline', fill: 'currentColor', strokeWidth: '1' }} d="M324.55 595.207 202.462 744.14c-17.519 21.367-2.317 53.48 25.313 53.48h244.177c27.63 0 42.832-32.113 25.313-53.48L375.177 595.207c-13.094-15.979-37.533-15.979-50.627 0z" />
      <circle style={{ display: 'inline', fill: 'currentColor', strokeWidth: '1' }} cx="457.416" cy="450.465" r="57.786" />
    </svg>
  );
}

function FileImageFilledIcon() {
  return (
    <Icon component={FileImageFilledIconComponent} />
  );
}

export default FileImageFilledIcon;
