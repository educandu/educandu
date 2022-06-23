import React from 'react';
import iconNs from '@ant-design/icons';

const Icon = iconNs.default || iconNs;

export function LessonMarkedFavoriteIconComponent() {
  return (
    <svg height="1em" style={{ enableBackground: 'new 0 0 1000 1000' }} width="1em" viewBox="0 0 1000 1000">
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '60', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M62.61 562.45V107.68c0-39.42 31.96-71.38 71.38-71.38h400.23M62.61 791.78v-166.6m697.52 62.04v108.14" />
      <path style={{ fill: 'none', stroke: 'currentColor', strokeWidth: '60', strokeLinecap: 'round', strokeMiterlimit: '10' }} d="M757 868.38v23.94c0 39.42-31.96 71.38-71.38 71.38H242.57c-39.42 0-71.38-31.96-71.38-71.38v-684.1c0-39.42 31.96-71.38 71.38-71.38h443.04c39.42 0 71.38 31.96 74.51 71.38v16.04" />
      <path style={{ fill: 'currentColor' }} d="m780.65 306.21 45.72 109.06 117.85 9.78c16.3 1.35 22.9 21.67 10.51 32.35l-89.6 77.18 27.12 115.11c3.75 15.92-13.54 28.48-27.52 19.99l-101.09-61.36-101.09 61.36c-13.98 8.48-31.27-4.07-27.52-19.99l27.12-115.11-89.6-77.18c-12.39-10.67-5.79-30.99 10.51-32.35l117.85-9.78 45.72-109.06c6.33-15.08 27.69-15.08 34.02 0z" />
    </svg>
  );
}

function LessonMarkedFavoriteIcon(props) {
  return (
    <Icon component={LessonMarkedFavoriteIconComponent} {...props} />
  );
}

export default LessonMarkedFavoriteIcon;
