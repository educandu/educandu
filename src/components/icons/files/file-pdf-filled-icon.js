
import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function FilePdfFilledIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <g style={{ display: 'inline' }}>
        <path style={{ fill: '#f2f2f2', stroke: 'currentColor', strokeWidth: '20', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M138.72 363.74V101.9c0-43.96 35.63-79.59 79.59-79.59H605.9c14.55 0 28.47 5.94 38.54 16.45l202.01 210.87a53.346 53.346 0 0 1 14.83 36.92V898.1c0 43.96-35.63 79.59-79.59 79.59H218.31c-43.96 0-79.59-35.63-79.59-79.59V521.3" transform="translate(-5.446 .098)" />
        <path style={{ fill: '#fff', stroke: 'currentColor', strokeWidth: '20', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M861.28 292.23v-5.69c0-13.76-5.31-26.98-14.83-36.92L644.44 38.76a53.373 53.373 0 0 0-38.54-16.45h-7.14v186.72c0 45.95 37.26 83.2 83.21 83.2h156.8z" transform="translate(-5.446 .098)" />
      </g>
      <g style={{ display: 'inline' }}>
        <path style={{ fill: 'currentColor' }} d="M268.71 690.99c.26-10.73 6.79-19.63 18.32-19.63h55.46c41.1 0 59.4 29.57 59.4 59.14 0 29.83-18.3 58.88-59.4 58.88H306.9v45.78c0 9.68-8.62 17.8-19.1 17.8-9.94 0-19.1-8.38-19.1-17.8V690.99Zm38.2 14.12v50.78h33.75c14.93 0 22.78-13.62 22.78-25.39 0-11.25-7.33-25.39-21.72-25.39zm143.16 146.54c-9.68 0-15.17-7.59-15.17-16.23V687.59c.26-8.9 5.5-16.23 15.17-16.23h55.48c51.81 0 81.39 39.25 81.39 90.55 0 51.02-29.57 89.75-81.39 89.75h-55.48zm23.04-33.49h32.44c28.79 0 43.17-26.69 43.17-56.26 0-29.83-14.38-56.79-43.17-56.79h-32.44zm249.12-146.8c8.62 0 15.69 7.59 15.69 17.01 0 8.64-7.33 16.49-15.69 16.75h-59.94v41.34h44.49c8.64 0 15.71 7.33 15.71 16.49 0 8.64-7.33 16.49-15.71 16.49h-44.49v55.74c0 9.68-8.62 17.8-19.1 17.8-9.94 0-19.1-8.38-19.1-17.8V687.59c.26-8.9 5.5-16.23 15.17-16.23z" transform="translate(4.063 -123.1)" />
      </g>
    </svg>
  );
}

function FilePdfFilledIcon(props) {
  return (
    <Icon component={FilePdfFilledIconComponent} {...props} />
  );
}

export default FilePdfFilledIcon;
