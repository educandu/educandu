import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function RoomMarkedFavoriteIconComponent() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 1000 1000" style={{  enableBackground: 'new 0 0 1000 1000' }}>
      <path d="M520.14 963.09 91.47 913.43V86.57l428.67-49.66c17.39-2.01 32.68 11.31 32.68 28.49v869.2c-.01 17.18-15.29 30.51-32.68 28.49z" style={{    fill: 'none',    stroke: 'currentColor',    strokeWidth: 60,    strokeLinecap: 'round',    strokeMiterlimit: 10  }} />
      <path d="M552.81 913.44h187.83c18.63 0 33.73-15.1 33.73-33.73v-73.1m0-634.29V120.3c0-18.63-15.11-33.73-33.73-33.73H552.81" style={{    fill: 'none',    stroke: 'currentColor',    strokeWidth: 60,    strokeLinecap: 'round',    strokeMiterlimit: 10  }} />
      <ellipse cx={439.89} cy={510.55} rx={42.66} ry={50.85} style={{    fill: 'currentColor'  }} />
      <path d="M439.89 459.7c-23.56 0-42.66 22.77-42.66 50.85 0 28.09 19.1 50.85 42.66 50.85s42.66-22.77 42.66-50.85c0-28.08-19.1-50.85-42.66-50.85z" style={{    fill: 'currentColor'  }} />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 60, strokeLinecap: 'round', strokeMiterlimit: 10  }} d="M774.37 578.94v149.34" />
      <path d="M707.668 252.423a78.022 78.022 0 0 1 64.862 18.53l.481.43.442-.39A78.022 78.022 0 0 1 835 252.266l3.199.468a78.022 78.022 0 0 1 43.744 130.14l-2.34 2.406-.625.533-96.876 95.953a13.004 13.004 0 0 1-17.074 1.067l-1.223-1.067-97.435-96.512a78.022 78.022 0 0 1 41.299-132.832z" style={{ fill: 'currentColor', fillOpacity: 1, stroke: 'currentColor', strokeWidth: 13.0036, strokeOpacity: 1 }} />
    </svg>
  );
}

function RoomMarkedFavoriteIcon(props) {
  return (
    <Icon component={RoomMarkedFavoriteIconComponent} {...props} />
  );
}

export default RoomMarkedFavoriteIcon;
