
import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function FileImageIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '45', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M859.09 287.84v607.84c0 43.69-35.42 79.11-79.11 79.11H220.02c-43.69 0-79.11-35.42-79.11-79.11V104.32c0-43.69 35.42-79.11 79.11-79.11h385.24c14.46 0 28.3 5.91 38.3 16.35l200.78 209.59a52.995 52.995 0 0 1 14.75 36.69z" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '45', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M598.16 44.47V210.8c0 45.67 37.03 82.7 82.71 82.7h155.85" />
      <path style={{ display: 'inline', fill: 'currentColor', strokeWidth: '1' }} d="M575.487 518.731 412.27 747.13c-14.959 20.939.007 50.026 25.735 50.026h326.428c25.735 0 40.701-29.087 25.735-50.026l-163.203-228.4c-12.618-17.66-38.86-17.66-51.478 0z" />
      <path style={{ display: 'inline', fill: 'currentColor', strokeWidth: '1' }} d="M325.45 602.34 207.455 746.28c-16.93 20.65-2.239 51.687 24.465 51.687h235.988c26.704 0 41.395-31.037 24.464-51.688L374.378 602.34c-12.654-15.443-36.274-15.443-48.928 0z" />
      <circle style={{ display: 'inline', fill: 'currentColor', strokeWidth: '1' }} cx="453.86" cy="462.453" r="55.848" />
    </svg>
  );
}

function FileImageIcon() {
  return (
    <Icon component={FileImageIconComponent} />
  );
}

export default FileImageIcon;
