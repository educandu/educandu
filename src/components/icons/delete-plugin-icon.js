import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function DeletePluginIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '40', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: '10' }} d="M701.12 908.5H304.55l-81.27-658.41h559.11zM502.84 367.93v419.8m-131.33-419.8 39.4 419.8m223.25-419.8-39.4 419.8M205.25 180.82h589.5m-238.61-3.83V91.5H443.86v85.49" />
    </svg>
  );
}

function DeletePluginIcon() {
  return (
    <Icon component={DeletePluginIconComponent} />
  );
}

export default DeletePluginIcon;
