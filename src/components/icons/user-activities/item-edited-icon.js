import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function ItemEditedIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '50', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="m369.41 823.12 486.01-486.01c20.45-20.45 17.42-56.64-6.76-80.82L743.73 151.36c-24.19-24.19-60.37-27.21-80.82-6.76L176.9 630.61l-45.64 212.26c-2.25 14.08 11.78 28.11 25.86 25.86l212.29-45.61zm380.23-474.65-345.91 345.9m90.41-177.65L356.49 654.37m-120.7 32.15L362.87 813.6" />
      <path style={{ fill: 'currentColor' }} d="m148.3 780.06-16.52 68.71c-2.82 11.71 7.73 22.26 19.44 19.44l68.71-16.52-71.63-71.63z" />
    </svg>
  );
}

function ItemEditedIcon(props) {
  return (
    <Icon component={ItemEditedIconComponent} {...props} />
  );
}

export default ItemEditedIcon;
