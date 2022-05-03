import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function CopyToClipboardIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '40', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M365.4 783.03v-60.27m467.98-552.41h61.83c36.49 0 66.07 29.58 66.07 66.07v651.55c0 36.49-29.58 66.07-66.07 66.07H431.47c-36.49 0-66.07-29.58-66.07-66.07v0-104.94m0-428.65v58.809V236.41c0-36.49 29.58-66.07 66.07-66.07h63.09" transform="translate(-90)" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '40', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M801.21 221.23H469.47c-1.2 0-2.17-.97-2.17-2.17V118.12c0-1.2.97-2.17 2.17-2.17h331.74c1.2 0 2.17.97 2.17 2.17v100.95c0 1.19-.97 2.16-2.17 2.16zm-42.99-105.28V71.39c0-14.04-11.38-25.42-25.42-25.42H537.88c-14.04 0-25.42 11.38-25.42 25.42v44.56z" transform="translate(-62)" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '40', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M-48.339 563.96H397.99" transform="translate(148 -2)" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '40', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="m263.87 706.34 166.78-144.38-166.78-144.37" transform="matrix(1.005 0 0 .954 164.265 24.904)" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '40', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M863.06 755.7v91.98c0 17.53-14.21 31.75-31.75 31.75H723.19" transform="translate(-62)" />
    </svg>
  );
}

function CopyToClipboardIcon() {
  return (
    <Icon component={CopyToClipboardIconComponent} />
  );
}

export default CopyToClipboardIcon;
