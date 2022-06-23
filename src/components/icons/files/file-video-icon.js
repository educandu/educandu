import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function FileVideoIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ display: 'inline', fill: 'currentColor', strokeWidth: '1.07229' }} d="M628.616 596.045 434.275 457.173c-21.22-15.162-50.709 0-50.709 26.088v277.744c0 26.079 29.488 41.251 50.709 26.09l194.341-138.873c17.886-12.792 17.886-39.385 0-52.177z" />
      <g style={{ display: 'inline' }}>
        <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '45', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M859.09 287.84v607.84c0 43.69-35.42 79.11-79.11 79.11H220.02c-43.69 0-79.11-35.42-79.11-79.11V104.32c0-43.69 35.42-79.11 79.11-79.11h385.24c14.46 0 28.3 5.91 38.3 16.35l200.78 209.59a52.995 52.995 0 0 1 14.75 36.69z" transform="translate(2.086 1.914)" />
        <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '45', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M598.16 44.47V210.8c0 45.67 37.03 82.7 82.71 82.7h155.85" transform="translate(2.086 1.914)" />
      </g>
    </svg>
  );
}

function FileVideoIcon(props) {
  return (
    <Icon component={FileVideoIconComponent} {...props} />
  );
}

export default FileVideoIcon;
