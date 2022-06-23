import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function PasteFromClipboardIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '40', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M425.222 552.432h473.649" transform="translate(8 -4)" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '40', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="m263.87 706.34 166.78-144.38-166.78-144.37" transform="matrix(1.005 0 0 .954 525.722 17.057)" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '40', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M676.59 783.03v-60.27M208.61 170.35h-61.83c-36.49 0-66.07 29.58-66.07 66.07v651.55c0 36.49 29.58 66.07 66.07 66.07h463.74c36.49 0 66.07-29.58 66.07-66.07V783.03m-1.597-406.297v0l1.597-109.113v-31.21c0-36.49-29.58-66.07-66.07-66.07h-50.351" transform="translate(-4)" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '40', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M212.78 221.23h331.74c1.2 0 2.17-.97 2.17-2.17V118.12c0-1.2-.97-2.17-2.17-2.17H212.78c-1.2 0-2.17.97-2.17 2.17v100.95c0 1.19.97 2.16 2.17 2.16zm42.99-105.28V71.39c0-14.04 11.38-25.42 25.42-25.42h194.92c14.04 0 25.42 11.38 25.42 25.42v44.56H255.77zM146.92 755.7v91.98c0 17.53 14.21 31.75 31.75 31.75H286.8" />
    </svg>
  );
}

function PasteFromClipboardIcon(props) {
  return (
    <Icon component={PasteFromClipboardIconComponent} {...props} />
  );
}

export default PasteFromClipboardIcon;
