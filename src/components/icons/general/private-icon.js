import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function PrivateIconComponent() {
  return (
    <svg height="1.2em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1.2em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '40', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M399.946 389.347v-72.98c0-49.296 44.84-89.402 99.954-89.402 55.124 0 99.964 40.106 99.964 89.402v72.98h113.941v-72.98c0-112.116-95.962-203.343-213.895-203.343s-213.885 91.217-213.885 203.343v72.98zm385.415 295.467v167.58c0 36.433-29.532 65.955-65.955 65.955H280.404c-36.434 0-65.956-29.533-65.956-65.955V418.26c0-15.968 12.946-28.903 28.904-28.903h513.096c15.968 0 28.902 12.945 28.903 28.903l.01 266.554" transform="translate(-12.179 -55.411) scale(1.05977)" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '40', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="m426.223 573.567 149.77 149.758m0-149.758-149.77 149.758" transform="translate(-244.553 -353.404) scale(1.51462)" />
    </svg>
  );
}

function PrivateIcon() {
  return (
    <Icon component={PrivateIconComponent} />
  );
}

export default PrivateIcon;
